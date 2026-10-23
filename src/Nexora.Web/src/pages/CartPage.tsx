import { useCartQuote } from '../hooks/useCartQuote';
import { getQuotedCartItems } from '../lib/cartQuote';
import { SafeImage } from '../components/common/SafeImage';
import { EmptyState } from '../components/common/EmptyState';
import { CouponBox } from '../components/common/CouponBox';
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import type { CouponValidationResultDto } from '../types/coupon';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, isLoading, isError, isMutating, refreshCart, updateQuantity, removeFromCart } = useCart();
  const { settings } = useSettings();

  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResultDto | null>(() => {
    try {
      const saved = sessionStorage.getItem('appliedCoupon');
      return saved ? JSON.parse(saved) as CouponValidationResultDto : null;
    } catch {
      return null;
    }
  });
  const quoteQuery = useCartQuote(appliedCoupon?.couponCode);

  const cartItems = useMemo(() => getQuotedCartItems(cart?.items || [], quoteQuery.data), [cart?.items, quoteQuery.data]);
  const subtotal = quoteQuery.data?.subtotal ?? cart?.grandTotal ?? 0;
  const isFreeShipping = subtotal >= settings.freeShippingThreshold || subtotal === 0;
  const shippingFee = quoteQuery.data?.shippingFee ?? (isFreeShipping ? 0 : settings.shippingCost);
  const discountAmount = quoteQuery.data?.discountAmount ?? 0;
  const payableTotal = quoteQuery.data?.totalAmount ?? 0;

  const handleCouponApplied = (coupon: CouponValidationResultDto) => {
    setAppliedCoupon(coupon);
    sessionStorage.setItem('appliedCoupon', JSON.stringify(coupon));
  };

  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
    sessionStorage.removeItem('appliedCoupon');
  };

  if (isError) return <p role="alert" className="p-8 text-rose-600">Sepet yüklenemedi. <button onClick={() => void refreshCart()}>Tekrar dene</button></p>;
  if (isLoading && !cart) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon={ShoppingBag}
          title="Sepetiniz Henüz Boş"
          description="Sepetinizde ürün bulunmuyor. İlginizi çekebilecek ürünleri ve fırsatları keşfetmek için alışverişe başlayın."
          actionText="Alışverişe Başla"
          onAction={() => navigate('/products')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sepetim ({cartItems.length} Ürün)</h1>
        <Link to="/products" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Alışverişe Devam Et
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-8 space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm flex items-center justify-between gap-4">
              
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <Link to={`/products/${item.productId}`} className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 p-2 shrink-0 flex items-center justify-center hover:opacity-85 transition-opacity">
                  <SafeImage 
                    src={item.productImageUrl} 
                    alt={item.productName} 
                    className="max-h-full object-contain" 
                  />
                </Link>

                <div className="space-y-2 flex-1 min-w-0">
                  <Link to={`/products/${item.productId}`} className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug hover:text-orange-600 transition-colors block">
                    {item.productName}
                  </Link>


                  <div className="inline-flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                    <button aria-label="Miktarı azalt"
                      type="button" 
                      onClick={(e) => { e.preventDefault(); updateQuantity(item.id, item.quantity - 1); }}
                      className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-slate-600 font-bold transition-colors shadow-none hover:shadow-sm cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-bold text-xs text-slate-900 tabular-nums">{item.quantity}</span>
                    <button aria-label="Miktarı artır"
                      type="button" 
                      onClick={(e) => { e.preventDefault(); updateQuantity(item.id, item.quantity + 1); }}
                      className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-slate-600 font-bold transition-colors shadow-none hover:shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="text-base sm:text-lg font-black text-slate-900 block tabular-nums">
                    {item.totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                  </span>
                </div>

                <button aria-label="Ürünü Sil"
                  type="button" 
                  onClick={(e) => { e.preventDefault(); removeFromCart(item.id); }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Ürünü Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>

        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
            <CouponBox
              appliedCoupon={appliedCoupon}
              cartSubtotal={subtotal}
              discountAmount={discountAmount}
              onCouponApplied={handleCouponApplied}
              onCouponRemoved={handleCouponRemoved}
              disabled={isMutating}
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3">Sipariş Özeti</h3>

            <div className="space-y-2.5 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>Ürünlerin Toplamı</span>
                <span className="font-bold text-slate-900">{subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
              </div>
              
              <div className="flex justify-between">
                <span>Kargo Ücreti</span>
                <span className="font-bold text-emerald-600">{shippingFee === 0 ? 'BEDAVA' : `${shippingFee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Kupon İndirimi ({appliedCoupon?.couponCode})</span>
                  <span>-{discountAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
              <span className="text-xs font-black text-slate-900 uppercase">Ödenecek Tutar</span>
              <div className="text-right">
                <span className="text-2xl font-black text-orange-600">
                  {payableTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-bold text-orange-600 ml-1">TL</span>
              </div>
            </div>

            {quoteQuery.isError && <p role="alert" className="text-xs text-rose-600">Sepet tutarı hesaplanamadı. <button type="button" onClick={() => quoteQuery.refetch()}>Tekrar dene</button></p>}
            <button
              disabled={isMutating || quoteQuery.isFetching || !quoteQuery.data || quoteQuery.isError}
              onClick={() => {
                if (appliedCoupon) {
                  sessionStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
                } else {
                  sessionStorage.removeItem('appliedCoupon');
                }
                navigate('/checkout');
              }}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 pt-3 cursor-pointer"
            >
              <span>{quoteQuery.isFetching ? 'Tutar hesaplanıyor...' : 'Sepeti Onayla ve Öde'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
