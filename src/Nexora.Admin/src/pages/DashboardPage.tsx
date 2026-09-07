import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  ArrowUpRight, 
  RefreshCw,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  PieChart as PieChartIcon,
  BarChart3,
  Coins,
  Activity
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
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

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

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchAnalytics(),
      refetchProducts(),
      refetchCategories(),
      refetchBrands(),
      refetchOrders()
    ]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Teslim Edildi
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3.5 h-3.5 text-blue-600" /> Kargoda
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Package className="w-3.5 h-3.5 text-amber-600" /> Hazırlanıyor
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> İptal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> Beklemede
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 font-sans max-w-[1600px] mx-auto px-1 sm:px-2">
      {/* 1. Üst Başlık & Eylem Çubuğu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Mağaza Genel Bakış</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Nexora e-ticaret platformunun anlık ciro, sipariş ve katalog kontrol merkezi
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
            title="Tüm Verileri Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Ana KPI Metrik Kartları (4'lü Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toplam Hasılat</span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight block">
              ₺{(analytics?.totalRevenueAllTime || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> Net Tahsil Edilen Ciro
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toplam Sipariş</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight block">
              {isLoading ? '...' : totalOrderCount} <span className="text-sm font-medium text-slate-500">Adet</span>
            </span>
            <Link to="/orders" className="text-[11px] font-semibold text-orange-600 hover:underline flex items-center gap-1 mt-1">
              <span>Tüm Siparişleri İncele</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ortalama Sepet (AOV)</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight block">
              ₺{(analytics?.averageOrderValue || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] font-medium text-slate-400 block mt-1">
              Sipariş Başına Düşen Hacim
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aktif Stok Hacmi</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              ₺
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight block truncate">
              {isLoading ? '...' : totalInventoryValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-sm font-medium text-slate-500">TL</span>
            </span>
            <span className="text-[11px] font-medium text-slate-400 block mt-1">
              {totalProductCount} Ürün • {categoriesCount} Kategori • {brandsCount} Marka
            </span>
          </div>
        </div>
      </div>

      {/* 3. Hero Bölümü: Satış ve Gelir Analitiği + Günlük Trend Çizgisi */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-500" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Satış ve Gelir Performansı</h2>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Dönemsel hasılat eğrisi, sepet derinliği ve kategori bazlı gelir kırılımları
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Günlük Trend Grafiği */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Günlük Satış Trend Çizgisi</h3>
              <span className="text-xs font-semibold text-slate-400">Son {analyticsDays} Gün</span>
            </div>

            <div className="h-64 bg-slate-50/70 rounded-xl border border-slate-100 p-4 sm:p-5 flex flex-col justify-between relative">
              {(!analytics?.dailySales || analytics.dailySales.length === 0) ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Grafik için veri bulunmuyor.
                </div>
              ) : (
                (() => {
                  const maxRevenue = Math.max(...analytics.dailySales.map(d => d.totalRevenue), 1);
                  const step = analyticsDays === 30 ? 5 : analyticsDays === 14 ? 2 : 1;

                  return (
                    <div className="h-full flex flex-col justify-between pt-2">
                      {/* Barlar Alanı (Asla taşmaz, w-full ve gap-0.5 / gap-1 ile tam sığar) */}
                      <div className="flex-1 flex items-end gap-1 sm:gap-1.5 w-full">
                        {analytics.dailySales.map((item) => {
                          const hasSales = item.totalRevenue > 0;
                          const heightPct = hasSales 
                            ? Math.max(Math.round((item.totalRevenue / maxRevenue) * 100), 12) 
                            : 4;

                          return (
                            <div 
                              key={item.date} 
                              className="flex-1 h-full flex flex-col items-center justify-end group relative cursor-pointer"
                            >
                              {/* Hover Detay Tooltip'i */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-slate-900 text-white text-[11px] py-1.5 px-2.5 rounded-lg whitespace-nowrap pointer-events-none z-30 shadow-xl border border-slate-700 -translate-x-1/2 left-1/2">
                                <div className="font-bold text-orange-400">₺{item.totalRevenue.toLocaleString('tr-TR')}</div>
                                <div className="text-[10px] text-slate-300">{item.orderCount} sipariş • {item.date}</div>
                              </div>

                              <div 
                                className={`w-full rounded-t-sm sm:rounded-t transition-all duration-300 ${
                                  hasSales 
                                    ? 'bg-gradient-to-t from-orange-500 to-amber-400 group-hover:from-orange-600 group-hover:to-amber-500 shadow-xs' 
                                    : 'bg-slate-200/60 group-hover:bg-slate-300'
                                }`}
                                style={{ height: `${heightPct}%` }}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* X Ekseni Tarih Etiketleri (Sıkışmayı önlemek için akıllı aralıklarla gösterilir) */}
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium pt-3 border-t border-slate-200/60 mt-2 px-1">
                        {analytics.dailySales
                          .filter((_, idx) => idx % step === 0 || idx === analytics.dailySales.length - 1)
                          .map((item) => (
                            <span key={item.date}>
                              {item.date.slice(5)}
                            </span>
                          ))}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>

          {/* Kategori Bazlı Gelir Dağılımı */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Kategori Bazlı Hasılat</h3>
              <span className="text-xs font-semibold text-slate-400">Paylaşım</span>
            </div>

            <div className="bg-slate-50/70 rounded-xl border border-slate-100 p-4 space-y-3.5 h-64 overflow-y-auto">
              {(!analytics?.categorySales || analytics.categorySales.length === 0) ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Kategori satış verisi bulunmuyor.
                </div>
              ) : (
                analytics.categorySales.map((cat) => (
                  <div key={cat.categoryId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate pr-2">{cat.categoryName}</span>
                      <span className="font-bold text-orange-600 shrink-0">%{cat.percentage}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.max(cat.percentage, 5)}%` }} 
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{cat.totalQuantity} adet ürün</span>
                      <span className="font-medium text-slate-600">₺{cat.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Alt Detay Tabloları & Yan Kartlar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Sol Alan: Son Siparişler ve Son Ürünler (8 Sütun) */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          {/* Son Gelen Siparişler */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Son Gelen Siparişler</h2>
                <p className="text-xs text-slate-400 font-medium">Mağazaya ulaşan en güncel siparişlerin anlık akışı</p>
              </div>
              <Link to="/orders" className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">
                <span>Tüm Siparişler</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
              <table className="w-full text-left min-w-[500px]">
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
                        <td className="py-3.5 font-mono font-bold text-slate-900">
                          <Link to="/orders" className="hover:text-orange-600 transition-colors">
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="py-3.5 font-semibold text-slate-700">{order.customerFullName || 'İsimsiz Müşteri'}</td>
                        <td className="py-3.5 font-bold text-slate-900">
                          ₺{order.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 text-center">
                          {getStatusBadge(order.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Katalogdaki Son Ürünler */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Katalogdaki Son Ürünler</h2>
                <p className="text-xs text-slate-400 font-medium">Katalogdaki ürünlerin anlık stok ve fiyat durumu</p>
              </div>
              <Link to="/products" className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">
                <span>Tüm Ürünler</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
              <table className="w-full text-left min-w-[500px]">
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
                      <td className="py-3.5 pr-3">
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
                      <td className="py-3.5 font-medium text-slate-600">{product.categoryName}</td>
                      <td className="py-3.5 font-bold text-slate-900">₺{product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                          product.stockQuantity <= 25 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${product.stockQuantity <= 25 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
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

        {/* Sağ Alan: Sipariş Dağılımı ve Kritik Stok (4 Sütun) */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8">
          {/* Sipariş Dağılımı */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-blue-500" />
                <span>Sipariş Dağılımı</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">Anlık Durum</span>
            </div>

            <div className="space-y-2.5">
              {(analytics?.statusDistribution || []).map((item) => {
                const total = analytics?.totalOrdersAllTime || 1;
                const pct = Math.round((item.count / total) * 100);

                const getStatusMeta = (status: string) => {
                  switch (status.toLowerCase()) {
                    case 'delivered':
                      return {
                        label: 'Teslim Edildi',
                        icon: CheckCircle2,
                        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        barBg: 'bg-emerald-500'
                      };
                    case 'shipped':
                      return {
                        label: 'Kargoda',
                        icon: Truck,
                        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
                        barBg: 'bg-blue-500'
                      };
                    case 'processing':
                      return {
                        label: 'Hazırlanıyor',
                        icon: Package,
                        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
                        barBg: 'bg-amber-500'
                      };
                    case 'cancelled':
                      return {
                        label: 'İptal Edildi',
                        icon: XCircle,
                        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
                        barBg: 'bg-rose-500'
                      };
                    default:
                      return {
                        label: 'Beklemede',
                        icon: Clock,
                        badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
                        barBg: 'bg-slate-400'
                      };
                  }
                };

                const meta = getStatusMeta(item.status);
                const IconComponent = meta.icon;
                const displayLabel = item.statusLabel || meta.label;

                return (
                  <div key={item.status} className="space-y-1.5 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${meta.badgeBg}`}>
                        <IconComponent className="w-3.5 h-3.5" />
                        <span>{displayLabel}</span>
                      </span>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900">{item.count} Adet</span>
                        <span className="text-[11px] text-slate-400 font-medium ml-1.5">(%{pct})</span>
                      </div>
                    </div>

                    <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${meta.barBg}`}
                        style={{ width: `${Math.max(pct, item.count > 0 ? 6 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kritik Stok Uyarısı */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Kritik Stok Uyarısı</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                {lowStockProducts.length} Ürün
              </span>
            </div>

            <div className="space-y-2.5">
              {lowStockProducts.length === 0 ? (
                <div className="py-8 text-center text-xs font-medium text-slate-400">
                  Kritik stok seviyesinde ürün bulunmuyor.
                </div>
              ) : (
                lowStockProducts.slice(0, 5).map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between gap-3 hover:border-amber-200 transition-colors">
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-800 block truncate">{item.name}</span>
                      <span className="text-[10px] text-slate-400">{item.categoryName}</span>
                    </div>
                    <span className="text-xs font-bold text-amber-600 shrink-0 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      {item.stockQuantity} kaldı
                    </span>
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
