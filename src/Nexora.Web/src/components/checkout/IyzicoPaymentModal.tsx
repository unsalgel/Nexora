import { getTrustedPaymentUrl } from '../../features/checkout/checkoutSecurity';

interface IyzicoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentPageUrl: string | null;
}

// Hosted checkout keeps card entry and provider scripts outside the merchant origin.
export const IyzicoPaymentModal = ({ isOpen, onClose, paymentPageUrl }: IyzicoPaymentModalProps) => {
  if (!isOpen) return null;
  const url = getTrustedPaymentUrl(paymentPageUrl);
  return <div role="dialog" aria-modal="true" aria-label="Güvenli ödeme" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60">
    <div className="rounded-2xl bg-white p-8 space-y-4">
      <p>{url ? 'Ödemenizi iyzico’nun güvenli sayfasında tamamlayın.' : 'Güvenli ödeme adresi alınamadı.'}</p>
      {url && <a href={url} className="text-orange-600 underline">Güvenli ödemeye geç</a>}
      <button type="button" onClick={onClose} className="block">Kapat</button>
    </div>
  </div>;
};