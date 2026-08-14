import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, Ticket, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, isLoading, updateQuantity, removeFromCart } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponSuccess, setCouponSuccess] = useState('');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === 'NEXORA10') {
      setAppliedDiscount(200);
      setCouponSuccess('NEXORA10 kuponu ile 200 TL indirim uygulandı!');
    } else {
      setCouponSuccess('Geçersiz kupon kodu!');
    }
  };

  const cartItems = cart?.items || [];
  const cartGrandTotal = cart?.grandTotal || 0;
  const shippingFee = cartGrandTotal > 500 || cartGrandTotal === 0 ? 0 : 39.90;
  const payableTotal = Math.max(0, cartGrandTotal + shippingFee - appliedDiscount);

  if (isLoading && !cart) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4 py-12">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-2">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Sepetiniz Boş!</h2>
        <p className="text-xs text-slate-500 max-w-sm">Sepetinizde henüz ürün bulunmuyor. Binlerce indirimli ürünü keşfetmeye başlayın.</p>
        <Link
          to="/products"
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 flex items-center gap-2 pt-3 transition-transform active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Alışverişe Başla</span>
        </Link>
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
        
        {/* SOL: Ürün Listesi */}
        <div className="lg:col-span-8 space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <Link to={`/products/${item.productId}`} className="w-20 h-20 rounded-xl bg-slate-50 border p-2 shrink-0 flex items-center justify-center hover:opacity-85 transition-opacity">
                  <img 
                    src={item.productImageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80'} 
                    alt={item.productName} 
                    className="max-h-full object-contain" 
                  />
                </Link>

                <div className="space-y-1">
                  <Link to={`/products/${item.productId}`} className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug hover:text-orange-600 transition-colors">
                    {item.productName}
                  </Link>
                  <span className="text-[10px] text-emerald-600 font-bold block">Kargo Bedava</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                {/* Adet Seçici */}
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                  <button
                    type="button" onClick={(e) => { e.preventDefault(); updateQuantity(item.id, item.quantity - 1); }}
                    className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-slate-600 font-bold transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-xs text-slate-900">{item.quantity}</span>
                  <button
                    type="button" onClick={(e) => { e.preventDefault(); updateQuantity(item.id, item.quantity + 1); }}
                    className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-slate-600 font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Fiyat */}
                <div className="text-right">
                  <span className="text-base font-black text-slate-900 block">
                    {item.totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                  </span>
                </div>

                {/* Sil Butonu */}
                <button
                  type="button" onClick={(e) => { e.preventDefault(); removeFromCart(item.id); }}
                  className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Ürünü Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* SAĞ: Sipariş Özeti & Kupon */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* İndirim Kuponu */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Ticket className="w-4 h-4 text-orange-500" />
              <span>İndirim Kuponu</span>
            </h3>

            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="Kupon Kodu (Örn: NEXORA10)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-orange-500 uppercase"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-colors shrink-0"
              >
                Uygula
              </button>
            </form>

            {couponSuccess && (
              <p className={`text-xs font-semibold ${appliedDiscount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {couponSuccess}
              </p>
            )}
          </div>

          {/* Sipariş Özeti Kartı */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3">Sipariş Özeti</h3>

            <div className="space-y-2.5 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>Ürünlerin Toplamı</span>
                <span className="font-bold text-slate-900">{cartGrandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
              </div>
              
              <div className="flex justify-between">
                <span>Kargo Ücreti</span>
                <span className="font-bold text-emerald-600">{shippingFee === 0 ? 'BEDAVA' : `${shippingFee} TL`}</span>
              </div>

              {appliedDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Kupon İndirimi</span>
                  <span>-{appliedDiscount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
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

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 pt-3"
            >
              <span>Sepeti Onayla ve Öde</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Güvenli 256-Bit SSL Ödeme Altyapısı</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
