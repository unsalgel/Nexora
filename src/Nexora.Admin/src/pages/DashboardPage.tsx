import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Package, 
  Layers, 
  Tag, 
  TrendingUp, 
  AlertTriangle, 
  ArrowUpRight, 
  Plus, 
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';
import type { ApiResponse, PagedResponse } from '../lib/apiClient';

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
  // 1. Ürünleri Çek
  const { data: productsData, isLoading: isProductsLoading, refetch: refetchProducts } = useQuery<ApiResponse<PagedResponse<ProductDto>>>({
    queryKey: ['admin-dashboard-products'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PagedResponse<ProductDto>>>('/products', {
        params: { page: 1, pageSize: 20 }
      });
      return res.data;
    }
  });

  // 2. Kategorileri Çek (Redis)
  const { data: categoriesData, isLoading: isCatLoading } = useQuery<ApiResponse<CategoryDto[]>>({
    queryKey: ['admin-dashboard-categories'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<CategoryDto[]>>('/categories');
      return res.data;
    }
  });

  // 3. Markaları Çek (Redis)
  const { data: brandsData, isLoading: isBrandsLoading } = useQuery<ApiResponse<BrandDto[]>>({
    queryKey: ['admin-dashboard-brands'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<BrandDto[]>>('/brands');
      return res.data;
    }
  });

  const products = productsData?.data?.items || [];
  const totalProductCount = productsData?.data?.totalCount || 0;
  const categoriesCount = categoriesData?.data?.length || 0;
  const brandsCount = brandsData?.data?.length || 0;

  // İstatistiksel Hesaplamalar
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.price * p.stockQuantity), 0);
  const lowStockProducts = products.filter(p => p.stockQuantity <= 30);

  const isLoading = isProductsLoading || isCatLoading || isBrandsLoading;

  return (
    <div className="space-y-8 pb-12 font-sans">
      
      {/* Üst Başlık ve Hızlı Aksiyon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mağaza Genel Bakış</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Nexora e-ticaret platformunun anlık stok, satış ve katalog metrikleri
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchProducts()}
            className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Verileri Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            to="/products"
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Ürün Ekle</span>
          </Link>
        </div>
      </div>

      {/* 4 Ana Metrik Kartı */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* 1. Toplam Stok Değeri */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3 hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Stok Hacmi</span>
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

        {/* 2. Toplam Ürün Sayısı */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3 hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Katalog Ürünleri</span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
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

        {/* 3. Kategoriler */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3 hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategoriler</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight block">
              {isLoading ? '...' : categoriesCount} <span className="text-sm font-medium text-slate-500">Kategori</span>
            </span>
            <span className="text-[11px] font-medium text-blue-600 block mt-1">
              Redis Önbellekli Aktif Ağ
            </span>
          </div>
        </div>

        {/* 4. Markalar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3 hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Anlaşmalı Markalar</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight block">
              {isLoading ? '...' : brandsCount} <span className="text-sm font-medium text-slate-500">Marka</span>
            </span>
            <span className="text-[11px] font-medium text-purple-600 block mt-1">
              Yetkili Distribütörler
            </span>
          </div>
        </div>

      </div>

      {/* 2 Sütunlu Alt Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SOL: Son Eklenen Ürünler Tablosu (8 Kolon) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Katalogdaki Son Ürünler</h2>
              <p className="text-xs text-slate-400 font-medium">Son eklenen ürünlerin fiyat ve stok durumu</p>
            </div>
            <Link to="/products" className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">
              <span>Tümünü Gör</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
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

        {/* SAĞ: Kritik Stok Uyarıları (4 Kolon) */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
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

        </div>

      </div>

    </div>
  );
};

