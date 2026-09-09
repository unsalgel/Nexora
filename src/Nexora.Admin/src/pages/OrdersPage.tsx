import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { 
  ShoppingBag, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Package, 
  XCircle, 
  ChevronRight, 
  Search, 
  X, 
  MapPin, 
  User, 
  AlertCircle, 
  Filter,
  CreditCard,
  Hash
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { AxiosError } from 'axios';
import type { ApiResponse, PagedResponse } from '../lib/apiClient';
import type { AdminOrderDto } from '../types/order';

export const OrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDto | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  
  // Kargo güncelleme formu için yerel state'ler
  const [carrierInput, setCarrierInput] = useState('Yurtiçi Kargo');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [isShippingOpen, setIsShippingOpen] = useState(false);

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

  const isRecentOrder = (createdAtUtc: string): boolean => {
    const orderDate = new Date(createdAtUtc).getTime();
    const now = new Date().getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return now - orderDate <= twentyFourHours;
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      orderId, 
      newStatus, 
      carrier, 
      trackingNumber 
    }: { 
      orderId: string; 
      newStatus: number; 
      carrier?: string; 
      trackingNumber?: string; 
    }) => {
      setModalError(null);
      const res = await apiClient.put<ApiResponse<string>>(`/orders/${orderId}/status`, {
        newStatus,
        carrier,
        trackingNumber
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
          status: statusMap[variables.newStatus] || selectedOrder.status,
          carrier: variables.carrier || selectedOrder.carrier,
          trackingNumber: variables.trackingNumber || selectedOrder.trackingNumber
        });
        setIsShippingOpen(false);
      }
    },
    onError: (err: unknown) => {
      const error = err as AxiosError<{ message?: string }>;
      setModalError(error.response?.data?.message || 'Sipariş durumu güncellenirken bir hata oluştu.');
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Ödendi
          </span>
        );
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
    { label: 'Ödenen Siparişler', value: 'Paid', icon: CreditCard },
    { label: 'Hazırlanıyor', value: 'Processing', icon: Package },
    { label: 'Kargoya Verildi', value: 'Shipped', icon: Truck },
    { label: 'Teslim Edildi', value: 'Delivered', icon: CheckCircle2 },
    { label: 'İptal Edilenler', value: 'Cancelled', icon: XCircle },
  ];

  const handleOpenOrder = (order: AdminOrderDto) => {
    setSelectedOrder(order);
    setCarrierInput(order.carrier || 'Yurtiçi Kargo');
    setTrackingNumberInput(order.trackingNumber || '');
    setIsShippingOpen(false);
    setModalError(null);
  };

  const carrierOptions = [
    'Yurtiçi Kargo',
    'Aras Kargo',
    'MNG Kargo',
    'Trendyol Express',
    'Sürat Kargo',
    'HepsiJET',
    'Kolay Gelsin'
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
                <th className="py-3.5 px-4 text-center">Kargo</th>
                <th className="py-3.5 px-4 text-center">Durum</th>
                <th className="py-3.5 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-orange-500" />
                      <span>Siparişler yükleniyor...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingBag className="w-8 h-8 text-slate-300 stroke-1" />
                      <span className="font-semibold text-slate-700">Sipariş Bulunamadı</span>
                      <span className="text-[11px] text-slate-400">Aranan kriterlere uygun bir sipariş kaydı mevcut değil.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const isNew = isRecentOrder(order.createdAtUtc);

                  return (
                    <tr
                      key={order.id}
                      onClick={() => handleOpenOrder(order)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </div>
                          <span>{order.orderNumber}</span>
                          {isNew && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-orange-500 text-white uppercase tracking-wider shadow-2xs">
                              YENİ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{order.customerFullName || 'Bilinmeyen Müşteri'}</div>
                        <div className="text-[11px] text-slate-400">{order.customerEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {new Date(order.createdAtUtc).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                        {order.items?.reduce((acc, i) => acc + i.quantity, 0) || 0} adet
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {order.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {order.trackingNumber ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                              <Truck className="w-3 h-3" /> {order.carrier || 'Kargo'}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">{order.trackingNumber}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenOrder(order);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Detay Görüntüle"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs text-slate-500">
          <span>Toplam <strong>{totalCount}</strong> sipariş listeleniyor</span>
          {totalCount > pageSize && (
            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-50 text-xs font-semibold"
              >
                Önceki
              </button>
              <span>Sayfa {page}</span>
              <button
                disabled={page * pageSize >= totalCount}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-50 text-xs font-semibold"
              >
                Sonraki
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{selectedOrder.orderNumber}</h2>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sipariş Tarihi: {new Date(selectedOrder.createdAtUtc).toLocaleString('tr-TR')}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-slate-700 text-xs font-bold">
                  <User className="w-4 h-4 text-orange-500" />
                  <span>Müşteri Bilgileri</span>
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-slate-800">{selectedOrder.customerFullName}</p>
                  <p className="text-slate-500">{selectedOrder.customerEmail}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-slate-700 text-xs font-bold">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  <span>Teslimat Adresi</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{selectedOrder.shippingAddress}</p>
              </div>
            </div>

            {/* Mevcut Kargo Bilgisi Alanı */}
            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-xs">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Kargo Sevkiyat Durumu</span>
                  {selectedOrder.trackingNumber ? (
                    <span className="text-xs text-blue-700 font-medium">
                      {selectedOrder.carrier || 'Kargo Firması'}: <strong className="font-mono">{selectedOrder.trackingNumber}</strong>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">Henüz kargo takip numarası girilmemiş.</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setIsShippingOpen(!isShippingOpen)}
                className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
              >
                {isShippingOpen ? 'Vazgeç' : (selectedOrder.trackingNumber ? 'Kargo Bilgisini Güncelle' : 'Kargoya Ver')}
              </button>
            </div>

            {/* Kargo Bilgisi Giriş Formu */}
            {isShippingOpen && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in-50">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-orange-500" />
                  <span>Kargo Firması & Takip Kodu Girişi</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Kargo Firması</label>
                    <select
                      value={carrierInput}
                      onChange={(e) => setCarrierInput(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-orange-500"
                    >
                      {carrierOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Takip Numarası</label>
                    <div className="relative">
                      <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={trackingNumberInput}
                        onChange={(e) => setTrackingNumberInput(e.target.value)}
                        placeholder="Örn: 123456789012"
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    disabled={updateStatusMutation.isPending || !trackingNumberInput.trim()}
                    onClick={() => updateStatusMutation.mutate({
                      orderId: selectedOrder.id,
                      newStatus: 4, // Shipped
                      carrier: carrierInput,
                      trackingNumber: trackingNumberInput.trim()
                    })}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Kargoya Ver ve Kaydet</span>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Sipariş Edilen Ürünler</h3>
              <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <h4 className="font-bold text-slate-800">{item.productName}</h4>
                      {item.variantSKU && (
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">SKU: {item.variantSKU}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">
                        {item.totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.quantity} x {item.unitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Toplam Tahsil Edilen Tutar</span>
              <span className="text-base font-black text-orange-600">
                {selectedOrder.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </span>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Sipariş Durumunu Güncelle</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { status: 2, label: 'Ödendi', icon: CreditCard, color: 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200' },
                  { status: 3, label: 'Hazırlanıyor', icon: Package, color: 'hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200' },
                  { status: 4, label: 'Kargoya Verildi', icon: Truck, color: 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200' },
                  { status: 5, label: 'Teslim Edildi', icon: CheckCircle2, color: 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200' },
                  { status: 6, label: 'İptal Et', icon: XCircle, color: 'hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200' },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.status}
                      disabled={updateStatusMutation.isPending}
                      onClick={() => {
                        if (action.status === 4 && !selectedOrder.trackingNumber) {
                          setIsShippingOpen(true);
                        } else {
                          updateStatusMutation.mutate({ 
                            orderId: selectedOrder.id, 
                            newStatus: action.status,
                            carrier: selectedOrder.carrier || undefined,
                            trackingNumber: selectedOrder.trackingNumber || undefined
                          });
                        }
                      }}
                      className={`p-2.5 border border-slate-200 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer bg-white text-slate-700 ${action.color}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
