import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAccessToken } from '../lib/session';
import { checkoutService } from '../features/checkout/checkoutService';
import { sanitizeOrderNumber } from '../features/checkout/checkoutSecurity';
import { useCart } from '../context/CartContext';
import { OrderSuccessView } from '../components/checkout/OrderSuccessView';

export const PaymentResultPage = () => {
  const [params] = useSearchParams();
  const orderNumber = sanitizeOrderNumber(params.get('order'));
  const token = useAccessToken();
  const { refreshCart } = useCart();
  const query = useQuery({
    queryKey: ['payment-status', orderNumber],
    queryFn: () => checkoutService.getPaymentStatus(orderNumber!),
    enabled: !!orderNumber && !!token,
    refetchInterval: query => {
      const status = query.state.data?.paymentStatus;
      return query.state.error || status === 'Success' || status === 'Failed' || status === 'Refunded' ? false : 5000;
    },
  });
  const paid = query.data?.paymentStatus === 'Success';
  useEffect(() => {
    if (!paid) return;
    sessionStorage.removeItem('appliedCoupon');
    void refreshCart();
  }, [paid, refreshCart]);

  if (!token) return <div className="py-12 text-center">Ödeme sonucunu görmek için <Link to="/login" className="text-orange-600 underline">giriş yapın</Link>. Siparişinizi hesabınızdan kontrol edebilirsiniz.</div>;
  if (!orderNumber) return <div className="py-12 text-center">Ödeme referansı bulunamadı. <Link to="/orders" className="text-orange-600 underline">Siparişlerim</Link></div>;
  if (paid) return <OrderSuccessView orderNumber={query.data!.orderNumber} />;
  const failed = query.data?.paymentStatus === 'Failed';
  const refunded = query.data?.paymentStatus === 'Refunded';
  return <section className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4" aria-live="polite">
    <h1 className="text-xl font-bold">{failed ? 'Ödeme onaylanmadı' : refunded ? 'Ödeme iade edildi' : 'Ödeme sonucu kontrol ediliyor'}</h1>
    <p className="text-sm text-slate-600">{query.isError ? 'Sonuç şu anda alınamadı. Siparişinizi kontrol etmeden tekrar ödeme yapmayın.' : failed || refunded ? 'Sipariş durumunu hesabınızdan inceleyebilirsiniz.' : 'Banka ve ödeme kontrolleri sürerken bu sayfa güncellenir. Lütfen tekrar ödeme yapmayın.'}</p>
    <p className="font-mono text-sm">{orderNumber}</p>
    <button onClick={() => void query.refetch()} disabled={query.isFetching} className="px-4 py-2 rounded-lg bg-orange-600 text-white disabled:opacity-50">Sonucu yenile</button>
    <div><Link to="/orders" className="text-orange-600 underline">Siparişlerim</Link></div>
  </section>;
};
