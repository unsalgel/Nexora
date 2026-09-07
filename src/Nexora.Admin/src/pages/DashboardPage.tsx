import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Package, 
  Layers, 
  TrendingUp, 
  AlertTriangle, 
  ArrowUpRight, 
  Plus, 
  RefreshCw,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';
import type { ApiResponse, PagedResponse } from '../lib/apiClient';
import type { AdminOrderDto } from '../types/order';
import type { SalesAnalyticsDto } from '../types/dashboard';

interface ProductDto {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  categoryName: string;
  brandName: string;
  mainImageUrl?: string;
  isActive: boolean;
}

interface CategoryDto {
  id: string;
  name: string;
}

interface BrandDto {
  id: string;
  name: string;
}

export const DashboardPage: React.FC = () => {
  const [analyticsDays, setAnalyticsDays] = useState<number>(30);

  const { data: analyticsData, isLoading: isAnalyticsLoading, refetch: refetchAnalytics } = useQuery<ApiResponse<SalesAnalyticsDto>>({
    queryKey: ['admin-dashboard-analytics', analyticsDays],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<SalesAnalyticsDto>>('/dashboard/analytics', {
        params: { days: analyticsDays }
      });
      return res.data;
    }
  });

  const { data: productsData, isLoading: isProductsLoading, refetch: refetchProducts } = useQuery<ApiResponse<PagedResponse<ProductDto>>>({
    queryKey: ['admin-dashboard-products'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PagedResponse<ProductDto>>>('/products', {
        params: { page: 1, pageSize: 20 }
      });
      return res.data;
    }
  });

  const { data: categoriesData, isLoading: isCatLoading, refetch: refetchCategories } = useQuery<ApiResponse<CategoryDto[]>>({
    queryKey: ['admin-dashboard-categories'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<CategoryDto[]>>('/categories');
      return res.data;
    }
  });

  const { data: brandsData, isLoading: isBrandsLoading, refetch: refetchBrands } = useQuery<ApiResponse<BrandDto[]>>({
    queryKey: ['admin-dashboard-brands'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<BrandDto[]>>('/brands');
      return res.data;
    }
  });

  const { data: ordersData, isLoading: isOrdersLoading, refetch: refetchOrders } = useQuery<ApiResponse<PagedResponse<AdminOrderDto>>>({
    queryKey: ['admin-dashboard-orders'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PagedResponse<AdminOrderDto>>>('/orders/admin', {
        params: { page: 1, pageSize: 5 }
      });
      return res.data;
    }
  });

  const analytics = analyticsData?.data;
  const products = productsData?.data?.items || [];
  const totalProductCount = productsData?.data?.totalCount || 0;
  const categoriesCount = categoriesData?.data?.length || 0;
  const brandsCount = brandsData?.data?.length || 0;
  const orders = ordersData?.data?.items || [];
  const totalOrderCount = ordersData?.data?.totalCount || 0;

  const totalInventoryValue = products.reduce((acc, p) => acc + (p.price * p.stockQuantity), 0);
  const lowStockProducts = products.filter(p => p.stockQuantity <= 30);

  const isLoading = isProductsLoading || isCatLoading || isBrandsLoading || isOrdersLoading || isAnalyticsLoading;

  const handleRefreshAll = () => {
    refetchAnalytics();
    refetchProducts();
    refetchCategories();
    refetchBrands();
    refetchOrders();
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Teslim Edildi
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3 h-3 text-blue-600" /> Kargoda
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Package className="w-3 h-3 text-amber-600" /> Hazırlanıyor
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> İptal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" /> Beklemede
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mağaza Genel Bakış</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Nexora e-ticaret platformunun anlık stok, sipariş ve katalog metrikleri
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshAll}
            className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Tüm Verileri Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            to="/products"
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-xl shadow-xs hover:shadow-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Ürün Ekle</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toplam Sipariş</span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight block">
              {isLoading ? '...' : totalOrderCount} <span className="text-sm font-medium text-slate-500">Sipariş</span>
            </span>
            <Link to="/orders" className="text-[11px] font-semibold text-orange-600 hover:underline flex items-center gap-1 mt-1">
              <span>Tüm Siparişleri İncele</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toplam Stok Hacmi</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
              ₺
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight block">
              {isLoading ? '...' : totalInventoryValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-sm font-medium text-slate-500">TL</span>
            </span>
            <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> Aktif Envanter Değeri
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Katalog Ürünleri</span>
            <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight block">
              {isLoading ? '...' : totalProductCount} <span className="text-sm font-medium text-slate-500">Adet</span>
            </span>
            <span className="text-[11px] font-medium text-slate-400 block mt-1">
              Canlıda Listelenen Ürün
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kategori & Marka</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight block">
              {isLoading ? '...' : `${categoriesCount} / ${brandsCount}`}
            </span>
            <span className="text-[11px] font-medium text-blue-600 block mt-1">
              Kategori / Marka Ağı
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Son Gelen Siparişler</h2>
                <p className="text-xs text-slate-400 font-medium">Mağazaya ulaşan en güncel siparişlerin anlık durumu</p>
              </div>
              <Link to="/orders" className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">
                <span>Tüm Siparişler</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Sipariş No</th>
                    <th className="pb-3">Müşteri</th>
                    <th className="pb-3">Tutar</th>
                    <th className="pb-3 text-center">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                        Henüz sipariş kaydı bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 font-mono font-bold text-slate-900">{order.orderNumber}</td>
                        <td className="py-3 font-semibold text-slate-700">{order.customerFullName || 'İsimsiz Müşteri'}</td>
                        <td className="py-3 font-bold text-slate-900">
                          {order.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </td>
                        <td className="py-3 text-center">
                          {getStatusBadge(order.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Katalogdaki Son Ürünler</h2>
                <p className="text-xs text-slate-400 font-medium">Son eklenen ürünlerin fiyat ve stok durumu</p>
              </div>
              <Link to="/products" className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">
                <span>Tüm Ürünler</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Ürün Bilgisi</th>
                    <th className="pb-3">Kategori</th>
                    <th className="pb-3">Fiyat</th>
                    <th className="pb-3">Stok Durumu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {products.slice(0, 5).map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center shrink-0">
                            <img
                              src={product.mainImageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'}
                              alt={product.name}
                              className="max-h-full object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-slate-800 block truncate max-w-[200px]">{product.name}</span>
                            <span className="text-[10px] text-slate-400">{product.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-medium text-slate-600">{product.categoryName}</td>
                      <td className="py-3 font-bold text-slate-900">{product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold inline-block ${
                          product.stockQuantity <= 25 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {product.stockQuantity} Adet
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Kritik Stok Uyarısı</span>
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200">
                {lowStockProducts.length} Ürün
              </span>
            </div>

            <div className="space-y-3">
              {lowStockProducts.length === 0 ? (
                <div className="py-8 text-center text-xs font-medium text-slate-400">
                  Kritik stok seviyesinde ürün bulunmuyor.
                </div>
              ) : (
                lowStockProducts.slice(0, 5).map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-slate-800 block truncate">{item.name}</span>
                      <span className="text-[10px] text-slate-400">{item.categoryName}</span>
                    </div>
                    <span className="text-xs font-bold text-amber-600 shrink-0">
                      {item.stockQuantity} kaldı
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-blue-500" />
                <span>Sipariş Dağılımı</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">Genel Durum</span>
            </div>

            <div className="space-y-2.5">
              {(analytics?.statusDistribution || []).map((item) => {
                const total = analytics?.totalOrdersAllTime || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{item.label}</span>
                      <span className="font-bold text-slate-900">{item.count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.status === 'Delivered' ? 'bg-emerald-500' :
                          item.status === 'Shipped' ? 'bg-blue-500' :
                          item.status === 'Processing' ? 'bg-amber-500' :
                          item.status === 'Cancelled' ? 'bg-rose-500' : 'bg-slate-400'
                        }`}
                        style={{ width: `${Math.max(pct, item.count > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-500" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Satış ve Gelir Analitiği</h2>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Dönemsel ciro performansı, sepet ortalaması ve kategori bazlı gelir dağılımı
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setAnalyticsDays(days)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  analyticsDays === days
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Son {days} Gün
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Toplam Hasılat</span>
            <span className="text-xl font-bold text-slate-900 block">
              ₺{(analytics?.totalRevenueAllTime || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">İptal edilmeyen tüm siparişler</span>
          </div>

          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Ortalama Sepet Tutarı (AOV)</span>
            <span className="text-xl font-bold text-slate-900 block">
              ₺{(analytics?.averageOrderValue || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Sipariş başına düşen ciro</span>
          </div>

          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tamamlanan İşlem</span>
            <span className="text-xl font-bold text-slate-900 block">
              {analytics?.totalOrdersAllTime || 0} Adet
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Platform geneli sipariş hacmi</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          <div className="lg:col-span-8 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Günlük Satış Trend Çizgisi</h3>
            <div className="h-56 bg-slate-50/60 rounded-xl border border-slate-100 p-4 flex flex-col justify-between">
              {(!analytics?.dailySales || analytics.dailySales.length === 0) ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Grafik için veri bulunmuyor.
                </div>
              ) : (
                (() => {
                  const maxRevenue = Math.max(...analytics.dailySales.map(d => d.totalRevenue), 1);
                  return (
                    <div className="h-full flex items-end gap-1.5 sm:gap-2 pt-6">
                      {analytics.dailySales.map((item) => {
                        const heightPct = Math.max(Math.round((item.totalRevenue / maxRevenue) * 100), 4);
                        return (
                          <div key={item.date} className="flex-1 h-full flex flex-col items-center justify-end group relative">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap pointer-events-none z-10 shadow-md">
                              {item.date}: ₺{item.totalRevenue.toLocaleString('tr-TR')} ({item.orderCount} sipariş)
                            </div>
                            <div 
                              className="w-full bg-orange-400/80 group-hover:bg-orange-500 rounded-t transition-all duration-300"
                              style={{ height: `${heightPct}%` }}
                            />
                            <span className="text-[9px] text-slate-400 mt-2 truncate w-full text-center hidden sm:block">
                              {item.date.slice(5)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Kategori Bazlı Hasılat</h3>
            <div className="bg-slate-50/60 rounded-xl border border-slate-100 p-4 space-y-3 max-h-56 overflow-y-auto">
              {(!analytics?.categorySales || analytics.categorySales.length === 0) ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Kategori satış verisi bulunmuyor.
                </div>
              ) : (
                analytics.categorySales.map((cat) => (
                  <div key={cat.categoryId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate pr-2">{cat.categoryName}</span>
                      <span className="font-bold text-slate-900 shrink-0">%{cat.percentage}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.max(cat.percentage, 4)}%` }} 
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{cat.totalQuantity} adet ürün</span>
                      <span>₺{cat.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
