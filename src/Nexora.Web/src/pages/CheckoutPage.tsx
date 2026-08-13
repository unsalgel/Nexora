import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, MapPin, CheckCircle2, ShieldCheck, ArrowRight, Lock } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [address, setAddress] = useState({
    fullName: 'Ünsal Gel',
    phone: '0555 123 45 67',
    city: 'İzmir',
    district: 'Karşıyaka',
    fullAddress: 'Cemal Gürsel Cad. No:45 Kat:3 Daire:8'
  });

  const [card, setCard] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: ''
  });

  const [isOrderComplete, setIsOrderComplete] = useState(false);

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOrderComplete(true);
  };

  if (isOrderComplete) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4 py-12">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-2">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black text-slate-900">Siparişiniz Alındı!</h2>
        <p className="text-xs text-slate-500 max-w-sm">Sipariş numaranız: <span className="font-bold text-slate-900">#NXR-2026-8942</span>. Sipariş durumunuzu profilinizden takip edebilirsiniz.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SOL FORM ALANI (8 Kolon) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* ADIM 1: ADRES BİLGİLERİ */}
          {step === 1 && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                <span>Teslimat Adresi</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Ad Soyad</label>
                  <input
                    type="text"
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Telefon Numarası</label>
                  <input
                    type="text"
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">İl</label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">İlçe</label>
                  <input
                    type="text"
                    value={address.district}
                    onChange={(e) => setAddress({ ...address, district: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Açık Adres</label>
                  <textarea
                    rows={3}
                    value={address.fullAddress}
                    onChange={(e) => setAddress({ ...address, fullAddress: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold"
                  />
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 pt-3 transition-transform active:scale-95"
              >
                <span>Ödeme Adımına Geç</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ADIM 2: ÖDEME (KART) BİLGİLERİ */}
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

              {/* Sanal 3D Kredi Kartı Görünümü */}
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

              {/* Ödeme Formu */}
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
                    maxLength={19}
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
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 pt-3 transition-transform active:scale-95"
                >
                  <ShieldCheck className="w-5 h-5 text-white" />
                  <span>3798.90 TL Ödemeyi Tamamla</span>
                </button>
              </form>

            </div>
          )}

        </div>

        {/* SAĞ SİPARİŞ ÖZETİ (4 Kolon) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3">Sipariş Özeti (2 Ürün)</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80" alt="" className="w-12 h-12 rounded-lg bg-slate-50 object-contain p-1 border" />
                <div className="flex-1 text-xs">
                  <h4 className="font-bold text-slate-800 line-clamp-1">Nexora Pro Wireless Kulaklık</h4>
                  <span className="text-slate-400">1 Adet</span>
                </div>
                <span className="text-xs font-bold text-slate-900">1.499,90 TL</span>
              </div>

              <div className="flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80" alt="" className="w-12 h-12 rounded-lg bg-slate-50 object-contain p-1 border" />
                <div className="flex-1 text-xs">
                  <h4 className="font-bold text-slate-800 line-clamp-1">Akıllı Saat GPS + Nabız</h4>
                  <span className="text-slate-400">1 Adet</span>
                </div>
                <span className="text-xs font-bold text-slate-900">2.299,00 TL</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Kargo</span>
                <span className="font-bold text-emerald-600">BEDAVA</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Toplam Tutar</span>
                <span className="text-orange-600">3.798,90 TL</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
