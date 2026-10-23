import React from 'react';
import { CreditCard, Lock, ShieldCheck } from 'lucide-react';

interface PaymentMethodSectionProps {
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

      <form onSubmit={onSubmitPayment} className="space-y-6">
        <div className="p-5 rounded-2xl bg-orange-50/50 border border-orange-100 flex items-start gap-3.5">
          <ShieldCheck className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <p className="font-bold text-slate-900 mb-1">İyzico Güvenli Ödeme</p>
            Bu yöntemde kart bilgilerinizi iyzico’nun güvenli ödeme sayfasında girersiniz. İşlem sonrasında ödeme sonucunu görmek için Nexora’ya geri yönlendirilirsiniz.
          </div>
        </div>

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
              : `${payableTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL için Güvenli Ödemeye Geç`}
          </span>
        </button>
      </form>
    </div>
  );
};
