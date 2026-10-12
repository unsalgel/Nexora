import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  ExternalLink, 
  Copy, 
  Check 
} from 'lucide-react';
import { Pagination } from '../ui/Pagination';
import type { OrderDto } from '../../types/order';

interface OrderHistoryTabProps {
  orders: OrderDto[];
  ordersPage: number;
  totalPages: number;
  totalCount: number;
  isLoading: boolean;
  isError: boolean;
  onPageChange: (page: number) => void;
  onRefetch: () => Promise<void> | void;
  onCancelOrder: (orderId: string) => Promise<void>;
  cancellingOrderId: string | null;
}

const orderSteps = [
  { label: 'Sipariş Alındı', icon: CheckCircle2 },
  { label: 'Hazırlanıyor', icon: Package },
  { label: 'Kargoya Verildi', icon: Truck },
  { label: 'Teslim Edildi', icon: CheckCircle2 },
];

export const OrderHistoryTab: React.FC<OrderHistoryTabProps> = ({
  orders,
  ordersPage,
  totalPages,
  totalCount,
  isLoading,
  isError,
  onPageChange,
  onRefetch,
  onCancelOrder,
  cancellingOrderId,
}) => {
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusStepIndex = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'paid':
        return 1;
      case 'processing':
        return 2;
      case 'shipped':
        return 3;
      case 'delivered':
        return 4;
      case 'cancelled':
        return -1;
      default:
        return 1;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Teslim Edildi
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3.5 h-3.5" /> Kargoya Verildi
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Package className="w-3.5 h-3.5" /> Hazırlanıyor
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> İptal Edildi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5" /> Sipariş Alındı
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in-50">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Siparişlerim</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Geçmiş ve devam eden tüm siparişlerinizin anlık kargo takip durumu
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
          {totalCount} Sipariş
        </span>
      </div>

      {isError ? (
        <p role="alert" className="p-5 text-rose-600">
          Siparişler yüklenemedi.{' '}
          <button onClick={() => void onRefetch()} className="font-bold underline cursor-pointer">
            Tekrar dene
          </button>
        </p>
      ) : isLoading ? (
        <div className="flex justify-center items-center py-16">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-200/80 text-center space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">Henüz verilmiş bir siparişiniz bulunmuyor.</p>
          <button
            onClick={() => navigate('/products')}
            className="mt-2 px-5 py-2.5 bg-orange-500 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-orange-600 transition-all cursor-pointer"
          >
            Alışverişe Başla
          </button>
        </div>
      ) : (
        orders.map((order) => {
          const currentStep = getStatusStepIndex(order.status);
          const isCancelled = order.status.toLowerCase() === 'cancelled';
          const orderDate = new Date(order.createdAtUtc).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div key={order.id} className="border border-slate-200/90 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xs hover:shadow-sm transition-all bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">Sipariş No</span>
                  <span className="font-extrabold text-slate-900 text-xs font-mono">{order.orderNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">Sipariş Tarihi</span>
                  <span className="font-bold text-slate-700 text-xs">{orderDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">Toplam Tutar</span>
                  <span className="font-black text-orange-600 text-sm">
                    {order.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </span>
                </div>
                <div>{getStatusBadge(order.status)}</div>
              </div>

              {!isCancelled ? (
                <div className="py-3 px-2 space-y-4">
                  <div className="grid grid-cols-4 relative">
                    <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 h-1 bg-slate-100 z-0" />
                    <div 
                      className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-orange-500 z-0 transition-all duration-500"
                      style={{ width: `${((Math.max(1, currentStep) - 1) / 3) * 100}%` }}
                    />

                    {orderSteps.map((step, idx) => {
                      const stepNum = idx + 1;
                      const isCompleted = stepNum <= currentStep;
                      const isCurrent = stepNum === currentStep;
                      const Icon = step.icon;

                      return (
                        <div key={step.label} className="relative z-10 flex flex-col items-center text-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isCompleted 
                              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 ring-4 ring-orange-50' 
                              : 'bg-white border-2 border-slate-200 text-slate-300'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`text-[11px] font-bold tracking-tight ${
                            isCurrent ? 'text-orange-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {order.trackingNumber && (
                    <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/70 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/30 shrink-0">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {order.carrier || 'Kargo Firması'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                              Yolda
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600">
                            <span>Takip No:</span>
                            <strong className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-blue-200/80">
                              {order.trackingNumber}
                            </strong>
                            <button
                              aria-label="Takip Kodu Kopyala"
                              onClick={() => handleCopy(order.trackingNumber!)}
                              className="p-1 hover:bg-blue-100/60 rounded-md text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                              title="Takip Kodu Kopyala"
                            >
                              {copiedCode === order.trackingNumber ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent((order.carrier || 'kargo') + ' takip ' + order.trackingNumber)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-bold transition-all shadow-2xs border border-blue-200 cursor-pointer self-start sm:self-auto"
                      >
                        <span>Kargom Nerede</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>Bu sipariş iptal edilmiştir.</span>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Sipariş Edilen Ürünler</span>
                <div className="border border-slate-100 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50/50 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 p-1 shrink-0 flex items-center justify-center">
                          <Package className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-xs">{item.productName}</h3>
                          {item.variantSKU && (
                            <span className="text-[10px] text-slate-400 font-mono block">SKU: {item.variantSKU}</span>
                          )}
                          <span className="text-slate-500 text-[11px] font-medium">
                            {item.quantity} Adet x {item.unitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                          </span>
                        </div>
                      </div>
                      <span className="font-extrabold text-slate-900 text-xs shrink-0">
                        {item.totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="line-clamp-1">{order.shippingAddress}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Teslimat bilgisi kargo takibinden izlenebilir</span>
                </div>
                {(order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'paid') && (
                  <button
                    onClick={() => onCancelOrder(order.id)}
                    disabled={cancellingOrderId === order.id}
                    className="text-[11px] font-medium text-rose-600 hover:text-rose-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {cancellingOrderId === order.id ? 'İptal Ediliyor...' : 'Siparişi İptal Et'}
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      <Pagination
        page={ordersPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        isLoading={isLoading}
      />
    </div>
  );
};
