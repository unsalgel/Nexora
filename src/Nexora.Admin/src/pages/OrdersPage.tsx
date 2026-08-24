import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ShoppingBag, RefreshCw, Clock, CheckCircle2, Truck, Package, XCircle, ChevronRight, Search, X, MapPin, User, AlertCircle, Filter } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import type { ApiResponse, PagedResponse } from '../lib/apiClient';
import type { AdminOrderDto } from '../types/order';

export const OrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDto | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const pageSize = 20;

  const { data: ordersData, isLoading, refetch } = useQuery<ApiResponse<PagedResponse<AdminOrderDto>>>({
    queryKey: ['admin-orders-list', page, statusFilter, searchTerm],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PagedResponse<AdminOrderDto>>>('/orders/admin', {
        params: {
          page,
          pageSize,
          status: statusFilter || undefined,
          searchTerm: searchTerm || undefined
        }
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  });

  const orders = ordersData?.data?.items || [];
  const totalCount = ordersData?.data?.totalCount || 0;

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: number }) => {
      setModalError(null);
      const res = await apiClient.put<ApiResponse<string>>(`/orders/${orderId}/status`, {
        newStatus
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders-list'] });
      if (selectedOrder && selectedOrder.id === variables.orderId) {
        const statusMap: Record<number, string> = {
          1: 'Pending',
          2: 'Paid',
          3: 'Processing',
          4: 'Shipped',
          5: 'Delivered',
          6: 'Cancelled',
        };
        setSelectedOrder({
          ...selectedOrder,
          status: statusMap[variables.newStatus] || selectedOrder.status
        });
      }
    },
    onError: (err: any) => {
      setModalError(err.response?.data?.message || 'Sipariş durumu güncellenirken bir hata oluştu.');
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Teslim Edildi
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
            <Truck className="w-3.5 h-3.5 text-blue-600" /> Kargoya Verildi
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
            <Package className="w-3.5 h-3.5 text-amber-600" /> Hazırlanıyor
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> İptal Edildi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> Beklemede
          </span>
        );
    }
  };

  const statusTabs = [
    { label: 'Tüm Siparişler', value: '', icon: Filter },
    { label: 'Beklemede', value: 'Pending', icon: Clock },
    { label: 'Hazırlanıyor', value: 'Processing', icon: Package },
    { label: 'Kargoya Verildi', value: 'Shipped', icon: Truck },
    { label: 'Teslim Edildi', value: 'Delivered', icon: CheckCircle2 },
    { label: 'İptal Edilenler', value: 'Cancelled', icon: XCircle },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sipariş Yönetimi</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Platformdaki tüm müşteri siparişlerini anlık takip edin ve kargo süreçlerini yönetin
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-2 text-xs font-semibold w-fit"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Yenile</span>
        </button>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Sipariş numarası (NX-...), müşteri adı, e-posta veya teslimat adresi ile ara..."
            className="w-full bg-slate-50/80 border border-slate-200/90 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/10 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.value;
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25 border border-orange-500'
                    : 'bg-slate-50/90 hover:bg-slate-100/90 text-slate-600 border border-slate-200/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Sipariş No</th>
                <th className="py-3.5 px-4">Müşteri</th>
                <th className="py-3.5 px-4">Tarih</th>
                <th className="py-3.5 px-4 text-center">Ürün Adedi</th>
                <th className="py-3.5 px-4">Toplam Tutar</th>
                <th className="py-3.5 px-4 text-center">Durum</th>
                <th className="py-3.5 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-orange-500" />
                      <span>Siparişler yükleniyor...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingBag className="w-8 h-8 text-slate-300 stroke-1" />
                      <span className="font-semibold text-slate-600 text-sm">Sipariş Bulunamadı</span>
                      <span className="text-xs text-slate-400">Aranan kriterlere uygun bir sipariş kaydı mevcut değil.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order: AdminOrderDto) => (
                  <tr
                    key={order.id}
                    onClick={() => {
                      setSelectedOrder(order);
                      setModalError(null);
                    }}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-900 font-mono text-xs tracking-tight">{order.orderNumber}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{order.customerFullName || 'İsimsiz Müşteri'}</div>
                      <div className="text-[11px] text-slate-400 font-medium">{order.customerEmail}</div>
                    </td>

                    <td className="py-4 px-4 font-medium text-slate-500">
                      {new Date(order.createdAtUtc).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    <td className="py-4 px-4 text-center font-bold text-slate-700">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs">
                        {order.totalItemCount} adet
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-extrabold text-slate-900">
                        {order.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      {getStatusBadge(order.status)}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                          setModalError(null);
                        }}
                        className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all cursor-pointer"
                        title="Detayları İncele"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="py-3.5 px-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>Toplam <strong>{totalCount}</strong> sipariş listeleniyor</span>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 font-mono">
                    {selectedOrder.orderNumber}
                  </h2>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {new Date(selectedOrder.createdAtUtc).toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                  <User className="w-3.5 h-3.5" />
                  <span>Müşteri Bilgileri</span>
                </div>
                <div className="font-bold text-slate-900 text-xs">{selectedOrder.customerFullName}</div>
                <div className="text-slate-500 text-xs">{selectedOrder.customerEmail}</div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Teslimat Adresi</span>
                </div>
                <div className="font-medium text-slate-700 text-xs leading-relaxed">
                  {selectedOrder.shippingAddress}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700">Sipariş Edilen Ürünler</div>
              <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="p-3 bg-white flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      {item.variantSKU && (
                        <div className="text-[11px] text-slate-400 font-mono">SKU: {item.variantSKU}</div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-slate-900">
                        {item.totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.quantity} adet x {item.unitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 px-1">
                <span className="text-xs font-bold text-slate-500">Genel Toplam</span>
                <span className="text-base font-black text-slate-900">
                  {selectedOrder.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="text-xs font-bold text-slate-700">Kargo & Sipariş Durumunu Güncelle</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Hazırlanıyor', value: 3, disabled: selectedOrder.status === 'Delivered' || selectedOrder.status === 'Cancelled' },
                  { label: 'Kargoya Verildi', value: 4, disabled: selectedOrder.status === 'Delivered' || selectedOrder.status === 'Cancelled' },
                  { label: 'Teslim Edildi', value: 5, disabled: selectedOrder.status === 'Cancelled' },
                  { label: 'İptal Et', value: 6, disabled: selectedOrder.status === 'Delivered' || selectedOrder.status === 'Cancelled' },
                ].map((btn) => (
                  <button
                    key={btn.value}
                    disabled={btn.disabled || updateStatusMutation.isPending}
                    onClick={() => {
                      updateStatusMutation.mutate({
                        orderId: selectedOrder.id,
                        newStatus: btn.value
                      });
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      (selectedOrder.status === 'Processing' && btn.value === 3) ||
                      (selectedOrder.status === 'Shipped' && btn.value === 4) ||
                      (selectedOrder.status === 'Delivered' && btn.value === 5) ||
                      (selectedOrder.status === 'Cancelled' && btn.value === 6)
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
