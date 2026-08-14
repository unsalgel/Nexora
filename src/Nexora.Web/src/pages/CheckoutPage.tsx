import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { apiClient } from '../lib/apiClient';
import type { ApiResponse } from '../lib/apiClient';
import { CreditCard, MapPin, CheckCircle2, ShieldCheck, ArrowRight, Lock, AlertCircle } from 'lucide-react';

interface OrderDto {
  id: string;
  orderNumber: string;
}

export const CheckoutPage: React.FC = () => {

  const { cart, clearCart, refreshCart } = useCart();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);

  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    city: '',
    district: '',
    fullAddress: ''
  });

  const [card, setCard] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: ''
  });

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.fullName || !address.phone || !address.city || !address.district || !address.fullAddress) {
      setErrorMessage('Lütfen tüm adres bilgilerini doldurun.');
      return;
    }
    setErrorMessage(null);
    setStep(2);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const [month, year] = card.expiry.split('/');
    if (!month || !year) {
      setErrorMessage('Lütfen Son Kullanma Tarihini AA/YY formatında girin.');
      setIsLoading(false);
      return;
    }

    try {
      const fullShippingAddress = `${address.fullName} - Tel: ${address.phone} - Adres: ${address.fullAddress} ${address.district}/${address.city}`;

      const response = await apiClient.post<ApiResponse<OrderDto>>('/orders', {
        shippingAddress: fullShippingAddress,
        paymentInfo: {
          cardHolderName: card.holder,
          cardNumber: card.number.replace(/\s+/g, ''),
          expirationMonth: month.trim(),
          expirationYear: year.trim(),
          cvv: card.cvv.trim()
        }
      });

      if (response.data?.isSuccess) {
        setCreatedOrderNumber(response.data.data?.orderNumber || 'NXR-2026-TEMP');
        await clearCart(); // Sepeti temizler
        await refreshCart();
      } else {
        setErrorMessage(response.data?.message || 'Ödeme ve sipariş işlemi başarısız.');
      }
    } catch (err: any) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors && apiErrors.length > 0) {
        setErrorMessage(apiErrors[0]);
      } else {
        setErrorMessage(err.response?.data?.message || 'Ödeme doğrulanırken bir hata oluştu. Kart bilgilerinizi kontrol edin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const cartItems = cart?.items || [];
  const cartGrandTotal = cart?.grandTotal || 0;
  const shippingFee = cartGrandTotal > 500 || cartGrandTotal === 0 ? 0 : 39.90;
  const payableTotal = Math.max(0, cartGrandTotal + shippingFee);

  if (createdOrderNumber) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4 py-12">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-2">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black text-slate-900">Siparişiniz Alındı!</h2>
        <p className="text-xs text-slate-500 max-w-sm">Sipariş numaranız: <span className="font-bold text-slate-900">#{createdOrderNumber}</span>. Sipariş durumunuzu profilinizden takip edebilirsiniz.</p>
        <Link
          to="/"
          className="px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 pt-3 transition-transform active:scale-95"
        >
          <span>Ana Sayfaya Dön</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      
      {/* Ödeme Adımları Göstergesi */}
      <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
        <div className={`flex items-center gap-2 text-xs font-bold ${step === 1 ? 'text-orange-600' : 'text-slate-400'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step === 1 ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-600'}`}>1</div>
          <span>Teslimat Adresi</span>
        </div>
        <div className="w-12 h-0.5 bg-slate-200" />
        <div className={`flex items-center gap-2 text-xs font-bold ${step === 2 ? 'text-orange-600' : 'text-slate-400'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step === 2 ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-600'}`}>2</div>
          <span>Ödeme Bilgileri</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold max-w-md mx-auto animate-in fade-in-50">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SOL FORM ALANI */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* ADIM 1: ADRES BİLGİLERİ */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                <span>Teslimat Adresi</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Ad Soyad</label>
                  <input
                    type="text"
                    required
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Telefon Numarası</label>
                  <input
                    type="text"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">İl</label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">İlçe</label>
                  <input
                    type="text"
                    required
                    value={address.district}
                    onChange={(e) => setAddress({ ...address, district: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Açık Adres</label>
                  <textarea
                    rows={3}
                    required
                    value={address.fullAddress}
                    onChange={(e) => setAddress({ ...address, fullAddress: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 pt-3 transition-transform active:scale-95"
              >
                <span>Ödeme Adımına Geç</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ADIM 2: ÖDEME BİLGİLERİ */}
          {step === 2 && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-orange-500" />
                  <span>Kredi / Banka Kartı ile Ödeme</span>
                </h2>
                <button onClick={() => setStep(1)} className="text-xs font-bold text-orange-600 hover:underline">
                  Adresi Değiştir
                </button>
              </div>

              {/* Sanal 3D Kredi Kartı */}
              <div className="w-full max-w-sm mx-auto h-48 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 text-white p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-black italic text-lg tracking-wider text-orange-500">NEXORA</span>
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-mono uppercase block">Kart Numarası</span>
                  <p className="text-lg font-mono tracking-widest font-bold">
                    {card.number || '•••• •••• •••• ••••'}
                  </p>
                </div>
                <div className="flex justify-between items-end text-xs font-mono">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Kart Sahibi</span>
                    <p className="font-bold uppercase truncate max-w-[150px]">{card.holder || 'AD SOYAD'}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">SKT</span>
                    <p className="font-bold">{card.expiry || 'AA/YY'}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kart Üzerindeki İsim</label>
                  <input
                    type="text"
                    required
                    placeholder="Ahmet Yılmaz"
                    value={card.holder}
                    onChange={(e) => setCard({ ...card, holder: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kart Numarası</label>
                  <input
                    type="text"
                    required
                    placeholder="4543 0000 0000 0000"
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Son Kullanma Tarihi</label>
                    <input
                      type="text"
                      required
                      placeholder="12/28"
                      value={card.expiry}
                      onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Güvenlik Kodu (CVV)</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      placeholder="123"
                      value={card.cvv}
                      onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 pt-3 transition-transform active:scale-95 disabled:opacity-50"
                >
                  <ShieldCheck className="w-5 h-5 text-white" />
                  <span>{isLoading ? 'Yükleniyor...' : `${payableTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL Ödemeyi Tamamla`}</span>
                </button>
              </form>

            </div>
          )}

        </div>

        {/* SAĞ SİPARİŞ ÖZETİ */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3">Sipariş Özeti ({cartItems.length} Ürün)</h3>
            
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <img 
                    src={item.productImageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80"} 
                    alt="" 
                    className="w-12 h-12 rounded-lg bg-slate-50 object-contain p-1 border shrink-0" 
                  />
                  <div className="flex-1 text-xs">
                    <h4 className="font-bold text-slate-800 line-clamp-1">{item.productName}</h4>
                    <span className="text-slate-400">{item.quantity} Adet</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">{item.totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Ara Toplam</span>
                <span className="font-bold text-slate-950">{cartGrandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
              </div>
              <div className="flex justify-between">
                <span>Kargo</span>
                <span className="font-bold text-emerald-600">{shippingFee === 0 ? 'BEDAVA' : `${shippingFee} TL`}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Toplam Tutar</span>
                <span className="text-orange-600">{payableTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
