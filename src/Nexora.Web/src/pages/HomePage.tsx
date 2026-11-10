import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Heart, Star } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SafeImage } from '../components/common/SafeImage';
import { useFavorites } from '../context/FavoritesContext';
import type { ApiResponse, PagedResponse } from '../lib/apiClient';
import { apiClient } from '../lib/apiClient';
import { resolveImageUrl } from '../lib/imageUtils';

interface ProductListItem {
  id: string;
  name: string;
  price: number;
  brandName: string;
  mainImageUrl?: string | null;
  averageRating: number;
  reviewCount: number;
}

interface RecentViewItem { id: string }

const EMPTY_PRODUCTS: ProductListItem[] = [];

export const HomePage: React.FC = () => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { data: productsData, isLoading, isError, refetch } = useQuery<ApiResponse<PagedResponse<ProductListItem>>>({
    queryKey: ['home-products'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PagedResponse<ProductListItem>>>('/products', {
        params: { page: 1, pageSize: 8, isActive: true, sortBy: 'featured' }
      });
      return response.data;
    }
  });

  const [localRecentViews] = useState<RecentViewItem[]>(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem('nexora_recent_views') || '[]');
      return Array.isArray(stored)
        ? stored.filter((item): item is RecentViewItem => !!item && typeof item.id === 'string').slice(0, 4)
        : [];
    } catch { return []; }
  });
  const recentIds = localRecentViews.map(item => item.id).join(',');
  const { data: recentProductsData, isError: isRecentError, isLoading: isRecentLoading, refetch: refetchRecent } = useQuery({
    queryKey: ['recent-products', recentIds],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PagedResponse<ProductListItem>>>('/products', {
        params: { ids: recentIds, pageSize: 4, isActive: true }
      });
      return response.data.data.items;
    },
    enabled: !!recentIds,
  });
  const products = productsData?.data?.items || EMPTY_PRODUCTS;
  const recentlyViewed = localRecentViews.flatMap(item => {
    const product = recentProductsData?.find(product => product.id === item.id);
    return product ? [product] : [];
  });

  const renderProductGrid = (items: ProductListItem[], compact = false) => (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-6 lg:grid-cols-4">
      {items.map(product => (
        <article key={product.id} className="group relative flex min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
          <Link to={`/products/${product.id}`} className={`relative block overflow-hidden border-b border-slate-100 bg-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-orange-600 ${compact ? 'aspect-[4/3]' : 'aspect-square'}`}>
            <SafeImage src={product.mainImageUrl} alt={product.name} className="absolute inset-0 h-full w-full object-contain p-4" />
          </Link>
          <button
            type="button"
            aria-label={isFavorite(product.id) ? `${product.name} favorilerden çıkar` : `${product.name} favorilere ekle`}
            aria-pressed={isFavorite(product.id)}
            onClick={() => toggleFavorite({ id: product.id, title: product.name, price: product.price, oldPrice: 0, image: resolveImageUrl(product.mainImageUrl) })}
            className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-orange-300 hover:text-orange-600 focus-visible:outline-2 focus-visible:outline-orange-600"
          >
            <Heart aria-hidden="true" className={`h-4 w-4 ${isFavorite(product.id) ? 'fill-orange-500 text-orange-500' : ''}`} />
          </button>
          <div className="flex flex-1 flex-col p-3 sm:p-4">
            <p className="mb-1 text-xs font-medium text-slate-500">{product.brandName}</p>
            <h3 className="min-h-10 text-sm font-medium leading-5 text-slate-800">
              <Link to={`/products/${product.id}`} className="line-clamp-2 hover:text-orange-600 focus-visible:outline-2 focus-visible:outline-orange-600">{product.brandName && product.name.toLocaleLowerCase('tr-TR').startsWith(product.brandName.toLocaleLowerCase('tr-TR') + ' ') ? product.name.slice(product.brandName.length).trimStart() : product.name}</Link>
            </h3>
            <div className="mt-2 min-h-5 text-xs text-slate-500">
              {product.reviewCount > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <Star aria-hidden="true" className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-slate-700">{product.averageRating.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}</span>
                  <span>({product.reviewCount} değerlendirme)</span>
                </span>
              ) : <span>Henüz değerlendirilmedi</span>}
            </div>
            <p className="mb-4 mt-3 text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">
              {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-medium">TL</span>
            </p>
            <Link to={`/products/${product.id}`} className="mt-auto flex min-h-10 items-center justify-center gap-2 rounded border border-slate-200 px-2 text-xs font-semibold text-slate-700 transition-colors hover:border-orange-500 hover:text-orange-600 focus-visible:outline-2 focus-visible:outline-orange-600 sm:text-sm">
              Ürünü İncele <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );

  return (
    <div className="space-y-12 pb-12">
      <section aria-labelledby="new-products-heading" className="space-y-5">
        <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 id="new-products-heading" className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Yeni Eklenen Ürünler</h1>
            <p className="mt-1 text-sm text-slate-500">Kataloğumuza en son katılan ürünleri inceleyin.</p>
          </div>
          <Link to="/products" className="flex shrink-0 items-center gap-1 py-2 text-xs font-semibold text-orange-600 hover:underline sm:text-sm">
            Tüm Ürünler <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
        {isLoading ? <p role="status" className="py-12 text-center text-sm text-slate-500">Ürünler yükleniyor...</p>
          : isError ? <p role="alert" className="py-8 text-sm text-slate-600">Ürünler yüklenemedi. <button type="button" onClick={() => void refetch()} className="font-medium text-orange-600 underline">Tekrar dene</button></p>
          : products.length > 0 ? renderProductGrid(products)
          : <p className="py-12 text-center text-sm text-slate-500">Henüz listelenecek ürün bulunmuyor.</p>}
      </section>

      {localRecentViews.length > 0 && (isRecentLoading || isRecentError || recentlyViewed.length > 0) && (
        <section aria-labelledby="recent-products-heading" className="space-y-5">
          <div className="border-b border-slate-200 pb-4">
            <h2 id="recent-products-heading" className="text-lg font-semibold tracking-tight text-slate-900">Son İncelediğiniz Ürünler</h2>
            <p className="mt-1 text-sm text-slate-500">Kaldığınız yerden devam edin.</p>
          </div>
          {isRecentError ? <p role="alert" className="text-sm text-slate-600">Son incelenen ürünler yüklenemedi. <button type="button" onClick={() => void refetchRecent()} className="text-orange-600 underline">Tekrar dene</button></p>
            : isRecentLoading ? <p role="status" className="text-sm text-slate-500">Ürünler yükleniyor...</p>
            : renderProductGrid(recentlyViewed, true)}
        </section>
      )}
    </div>
  );
};
