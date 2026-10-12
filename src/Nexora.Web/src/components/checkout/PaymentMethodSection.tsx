import React from 'react';
import { CreditCard, Lock } from 'lucide-react';

interface PaymentMethodSectionProps {
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
          <span>Kredi / Banka Kartı ile Ödeme</span>
        </h2>
        <button
          onClick={onBackToAddress}
          className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
        >
          Adresi Değiştir
        </button>
      </div>

      <div className="w-full max-w-sm mx-auto h-48 [perspective:1000px]">
        <div
          className={`relative w-full h-full duration-500 [transform-style:preserve-3d] transition-transform ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {/* Kart Ön Yüz */}
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

          {/* Kart Arka Yüz */}
          <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl flex flex-col justify-between py-5 [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <div className="w-full h-10 bg-slate-950 mt-1" />
            <div className="px-6 space-y-1">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>GÜVENLİK KODU</span>
                <span>CVV</span>
              </div>
              <div className="bg-white text-slate-900 font-mono font-bold text-sm tracking-widest px-3 py-1.5 rounded text-right">
                {card.cvv || '•••'}
              </div>
            </div>
            <div className="px-6 text-[9px] text-slate-400 font-mono text-center">
              nexora.com güvenli ödeme altyapısı
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmitPayment} className="space-y-4">
        {quoteError && (
          <p role="alert" className="text-xs text-rose-600">
            Sepet tutarı hesaplanamadı. Kuponu/sepeti kontrol edin.{' '}
            <button type="button" onClick={onRefetchQuote} className="font-bold underline cursor-pointer">
              Tekrar dene
            </button>
          </p>
        )}

        <div>
          <label htmlFor="checkout-card-holder" className="text-xs font-bold text-slate-700 block mb-1">
            Kart Üzerindeki İsim
          </label>
          <input
            id="checkout-card-holder"
            type="text"
            required
            maxLength={100}
            placeholder="Kart üzerindeki tam ad ve soyad"
            value={card.holder}
            onFocus={() => setIsFlipped(false)}
            onChange={(e) => onCardHolderChange(e.target.value.toUpperCase())}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label htmlFor="checkout-card-number" className="text-xs font-bold text-slate-700 block mb-1">
            Kart Numarası
          </label>
          <input
            id="checkout-card-number"
            type="text"
            required
            maxLength={19}
            placeholder="0000 0000 0000 0000"
            value={card.number}
            onFocus={() => setIsFlipped(false)}
            onChange={(e) => onCardNumberChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="checkout-card-expiry" className="text-xs font-bold text-slate-700 block mb-1">
              Son Kullanma Tarihi
            </label>
            <input
              id="checkout-card-expiry"
              type="text"
              required
              maxLength={5}
              placeholder="AA/YY"
              value={card.expiry}
              onFocus={() => setIsFlipped(false)}
              onChange={(e) => onCardExpiryChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold font-mono text-center focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all"
            />
          </div>
          <div>
            <label htmlFor="checkout-card-cvv" className="text-xs font-bold text-slate-700 block mb-1">
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
              ? 'Ödeme Doğrulanıyor...'
              : `${payableTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL Güvenli Öde`}
          </span>
        </button>
      </form>
    </div>
  );
};
