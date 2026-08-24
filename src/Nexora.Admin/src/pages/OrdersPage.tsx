import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, RefreshCw, Clock, CheckCircle2, Truck, Package, XCircle, ChevronRight } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import type { ApiResponse, PagedResponse } from '../lib/apiClient';
import type { AdminOrderDto } from '../types/order';

export const OrdersPage: React.FC = () => {
  const [page] = useState(1);
  const pageSize = 20;

  // 1. Siparişleri Çekme Metodu (React Query)
  const { data: ordersData, isLoading, refetch } = useQuery<ApiResponse<PagedResponse<AdminOrderDto>>>({
    queryKey: ['admin-orders-list', page],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PagedResponse<AdminOrderDto>>>('/orders/admin', {
        params: { page, pageSize }
      });
      return res.data;
    }
  });

  const orders = ordersData?.data?.items || [];
  const totalCount = ordersData?.data?.totalCount || 0;

  // Durum Rozet Rengi ve İkonu Yardımcı Metodu
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Teslim Edildi
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3.5 h-3.5" /> Kargoya Verildi
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Package className="w-3.5 h-3.5" /> Hazırlanıyor
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> İptal Edildi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5" /> Beklemede
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Üst Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sipariş Yönetimi</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Platformdaki tüm müşteri siparişlerini görüntüleyin ve kargo süreçlerini yönetin
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-2 text-xs font-semibold w-fit"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Yenile</span>
        </button>
      </div>

      {/* Sipariş Tablosu */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Sipariş No</th>
                <th className="py-3 px-4">Müşteri</th>
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-4 text-center">Ürün Adedi</th>
                <th className="py-3 px-4">Toplam Tutar</th>
                <th className="py-3 px-4 text-center">Durum</th>
                <th className="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    Siparişler yükleniyor...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    Henüz oluşturulmuş bir sipariş bulunamadı.
                  </td>
                </tr>
              ) : (
                orders.map((order: AdminOrderDto) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-900 font-mono">{order.orderNumber}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{order.customerFullName || 'İsimsiz Müşteri'}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{order.customerEmail}</div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-500">
                      {new Date(order.createdAtUtc).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      {order.totalItemCount} adet
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">
                        {order.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(order.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
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

        {/* Tablo Alt Bilgi */}
        <div className="py-3 px-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>Toplam <strong>{totalCount}</strong> sipariş listeleniyor</span>
        </div>
      </div>
    </div>
  );
};
