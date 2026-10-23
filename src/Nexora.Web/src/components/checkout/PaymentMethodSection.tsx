import React from 'react';
import { CreditCard, Lock, ShieldCheck } from 'lucide-react';
import type { PaymentMethod } from '../../types/payment';

interface PaymentMethodSectionProps {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  card: {
    number: string;
    holder: string;
    expiry: string;
    cvv: string;
  };
  onCardHolderChange: (val: string) => void;
  onCardNumberChange: (val: string) => void;
  onCardExpiryChange: (val: string) => void;
  onCardCvvChange: (val: string) => void;
  isFlipped: boolean;
  setIsFlipped: (val: boolean) => void;
  cardBrand: string | null;
  payableTotal: number;
  isLoading: boolean;
  isMutating: boolean;
  quoteFetching: boolean;
  quoteError: boolean;
  onRefetchQuote: () => void;
  onSubmitPayment: (e: React.FormEvent) => void;
  onBackToAddress: () => void;
}

export const PaymentMethodSection: React.FC<PaymentMethodSectionProps> = ({
  paymentMethod,
  onPaymentMethodChange,
  card,
  onCardHolderChange,
  onCardNumberChange,
  onCardExpiryChange,
  onCardCvvChange,
  isFlipped,
  setIsFlipped,
  cardBrand,
  payableTotal,
  isLoading,
  isMutating,
  quoteFetching,
  quoteError,
  onRefetchQuote,
  onSubmitPayment,
  onBackToAddress,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-orange-500" />
          <span>Ödeme Yöntemi</span>
        </h2>
        <button
          onClick={onBackToAddress}
          className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
        >
          Adresi Değiştir
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onPaymentMethodChange('iyzico')}
          className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
            paymentMethod === 'iyzico'
              ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500 shadow-xs'
              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900">İyzico Güvenli Ödeme</span>
              <span className="text-[10px] bg-orange-100 text-orange-700 font-extrabold px-1.5 py-0.5 rounded-md">
                Önerilen
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Kart bilgilerinizi iyzico’nun güvenli ödeme sayfasında girerek tek çekim ödeyin.
            </p>
          </div>
        </button>

        {import.meta.env.DEV && <button
          type="button"
          onClick={() => onPaymentMethodChange('direct')}
          className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
            paymentMethod === 'direct'
              ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500 shadow-xs'
              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900">Doğrudan Kart Girişi</span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Geliştirici yerel test modu ile hızlı kart provizyonu.
            </p>
          </div>
        </button>}
      </div>

      <form onSubmit={onSubmitPayment} className="space-y-6">
        {import.meta.env.DEV && paymentMethod === 'direct' ? (
          <>
            <div className="w-full max-w-sm mx-auto h-48 [perspective:1000px]">
              <div
                className={`relative w-full h-full duration-500 [transform-style:preserve-3d] transition-transform ${
                  isFlipped ? '[transform:rotateY(180deg)]' : ''
                }`}
              >
                <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 text-white p-6 shadow-xl flex flex-col justify-between [backface-visibility:hidden]">
                  <div className="flex items-center justify-between">
                    <span className="font-black italic text-lg tracking-wider text-orange-500">NEXORA</span>
                    <div className="flex items-center gap-2">
                      {cardBrand === 'visa' && <span className="font-bold text-xs text-blue-400 font-mono tracking-widest">VISA</span>}
                      {cardBrand === 'mastercard' && <span className="font-bold text-xs text-amber-400 font-mono tracking-widest">MASTERCARD</span>}
                      {cardBrand === 'troy' && <span className="font-bold text-xs text-cyan-400 font-mono tracking-widest">TROY</span>}
                      {cardBrand === 'amex' && <span className="font-bold text-xs text-emerald-400 font-mono tracking-widest">AMEX</span>}
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Kart Numarası</span>
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

                <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl flex flex-col justify-between py-5 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                  <div className="w-full h-10 bg-slate-950 mt-1" />
                  <div className="px-6 space-y-1">
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono uppercase">
                      <span>CVV / CVC</span>
                      <span>3 HANE</span>
                    </div>
                    <div className="w-full bg-white text-slate-900 h-8 rounded-lg flex items-center justify-end px-3 font-mono font-bold tracking-widest text-sm">
                      {card.cvv ? '•'.repeat(card.cvv.length) : '•••'}
                    </div>
                  </div>
                  <p className="text-[8px] text-slate-500 text-center px-6">
                    Bu kart simülasyon amaçlıdır. Bilgiler şifrelenir.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="checkout-card-holder" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kart Üzerindeki İsim
                </label>
                <input
                  id="checkout-card-holder"
                  type="text"
                  required
                  placeholder="AD SOYAD"
                  value={card.holder}
                  onChange={(e) => onCardHolderChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold uppercase focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label htmlFor="checkout-card-number" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kart Numarası
                </label>
                <input
                  id="checkout-card-number"
                  type="text"
                  required
                  placeholder="0000 0000 0000 0000"
                  value={card.number}
                  onChange={(e) => onCardNumberChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="checkout-card-expiry" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Son Kullanma (AA/YY)
                  </label>
                  <input
                    id="checkout-card-expiry"
                    type="text"
                    required
                    placeholder="AA/YY"
                    value={card.expiry}
                    onChange={(e) => onCardExpiryChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold font-mono text-center focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="checkout-card-cvv" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Güvenlik Kodu (CVV)
                  </label>
                  <input
                    id="checkout-card-cvv"
                    type="password"
                    required
                    maxLength={4}
                    placeholder="•••"
                    value={card.cvv}
                    onFocus={() => setIsFlipped(true)}
                    onBlur={() => setIsFlipped(false)}
                    onChange={(e) => onCardCvvChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold font-mono text-center focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-5 rounded-2xl bg-orange-50/50 border border-orange-100 flex items-start gap-3.5">
            <ShieldCheck className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <p className="font-bold text-slate-900 mb-1">PCI-DSS Uyumlu Güvenli Ödeme</p>
              Bu yöntemde kart bilgilerinizi iyzico’nun güvenli ödeme sayfasında girersiniz. İşlem sonrasında ödeme sonucunu görmek için Nexora’ya geri yönlendirilirsiniz.
            </div>
          </div>
        )}

        {quoteError && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-800">
            <span>Sepet tutarı hesaplanırken bir sorun oluştu.</span>
            <button
              type="button"
              onClick={onRefetchQuote}
              className="text-orange-600 font-bold hover:underline cursor-pointer"
            >
              Yeniden Dene
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || isMutating || quoteFetching}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <Lock className="w-4 h-4" />
          <span>
            {quoteFetching
              ? 'Tutar hesaplanıyor...'
              : isLoading
              ? 'İşlem Başlatılıyor...'
              : paymentMethod === 'iyzico'
              ? `${payableTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL için Güvenli Ödemeye Geç`
              : `${payableTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL Güvenli Öde`}
          </span>
        </button>
      </form>
    </div>
  );
};
