import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  Dumbbell,
  Flower2,
  Heart,
  Home,
  Laptop,
  LayoutGrid,
  Shirt,
  ShoppingBag,
  Star,
  Watch,
  Zap
} from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SafeImage } from '../components/common/SafeImage';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import type { ApiResponse, PagedResponse } from '../lib/apiClient';
import { apiClient } from '../lib/apiClient';
import { resolveImageUrl } from '../lib/imageUtils';

interface ProductImageDto {
  id: string;
  imageUrl: string;
  isMain: boolean;
  displayOrder: number;
}

interface HomeProductItem {
  id: string;
  title: string;
  price: number;
  oldPrice: number;
  rating: number;
  reviews: number;
  imageUrl: string;
  badge?: string;
  coupon?: string;
}

interface RecentViewItem {
  id: string;
  name?: string;
  title?: string;
  price: number;
  mainImageUrl?: string;
  image?: string;
  imageUrl?: string;
}

interface ProductDto {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  stockQuantity: number;
  categoryId: string;
  categoryName: string;
  brandId: string;
  brandName: string;
  isActive: boolean;
  images: ProductImageDto[];
  mainImageUrl?: string;
  averageRating: number;
  reviewCount: number;
}

const EMPTY_PRODUCTS: ProductDto[] = [];

export const HomePage: React.FC = () => {
  const { toggleFavorite: toggleFavStore, isFavorite: checkIsFav } = useFavorites();
  const { addToCart } = useCart();
  const [addedCartItems, setAddedCartItems] = useState<{ [key: string]: boolean }>({});

  const { data: productsData, isLoading, isError, refetch } = useQuery<ApiResponse<PagedResponse<ProductDto>>>({
    queryKey: ['home-products'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PagedResponse<ProductDto>>>('/products', {
        params: { page: 1, pageSize: 8, isActive: true }
      });
      return response.data;
    }
  });

  const toggleFavorite = (product: HomeProductItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavStore({
      id: product.id,
      title: product.title,
      price: product.price,
      oldPrice: product.oldPrice,
      image: product.imageUrl
    });
  };

  const handleAddToCart = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const success = await addToCart(productId, 1);
    if (success) {
      setAddedCartItems(prev => ({ ...prev, [productId]: true }));
      setTimeout(() => {
        setAddedCartItems(prev => ({ ...prev, [productId]: false }));
      }, 2000);
    }
  };

  const categoryStyles = [
    { name: 'Süper Fırsatlar', icon: Zap, color: 'from-orange-500 to-amber-500', shadow: 'shadow-orange-500/20' },
    { name: 'Elektronik', icon: Laptop, color: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
    { name: 'Moda & Giyim', icon: Shirt, color: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-500/20' },
    { name: 'Ev & Yaşam', icon: Home, color: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20' },
    { name: 'Kozmetik', icon: Flower2, color: 'from-purple-500 to-violet-500', shadow: 'shadow-purple-500/20' },
    { name: 'Spor & Outdoor', icon: Dumbbell, color: 'from-amber-500 to-yellow-500', shadow: 'shadow-amber-500/20' },
    { name: 'Aksesuar', icon: Watch, color: 'from-indigo-500 to-blue-500', shadow: 'shadow-indigo-500/20' },
    { name: 'Tüm Kategoriler', icon: LayoutGrid, color: 'from-slate-600 to-slate-800', shadow: 'shadow-slate-500/20' }
  ];

  const { data: categoryData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await apiClient.get<ApiResponse<{ id: string; name: string; isActive: boolean }[]>>('/categories')).data
  });
  const categoriesList: { id: string; name: string; isActive: boolean }[] = Array.isArray(categoryData)
    ? categoryData
    : Array.isArray((categoryData as any)?.data)
      ? (categoryData as any).data
      : [];
  const featuredCategories = categoriesList.filter(category => category.isActive).slice(0, 7).map((category, index) => ({ ...categoryStyles[index], id: category.id, name: category.name }));
  featuredCategories.push({ ...categoryStyles[7], id: '', name: 'Tüm Kategoriler' });
  const dbProducts = productsData?.data?.items || EMPTY_PRODUCTS;

  const [localRecentViews] = useState<RecentViewItem[]>(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem('nexora_recent_views') || '[]');
      return Array.isArray(stored) ? stored.filter((item): item is RecentViewItem => !!item && typeof item.id === 'string').slice(0, 8) : [];
    } catch { return []; }
  });
  const recentIds = localRecentViews.map(item => item.id).join(',');
  const { data: recentProductsData, isError: isRecentError, isLoading: isRecentLoading, refetch: refetchRecent } = useQuery({
    queryKey: ['recent-products', recentIds],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PagedResponse<ProductDto>>>('/products', { params: { ids: recentIds, pageSize: 8, isActive: true } });
      return response.data.data.items;
    },
    enabled: !!recentIds,
  });
  const toHomeItem = (product: ProductDto): HomeProductItem => ({
    id: product.id, title: product.name, price: product.price, oldPrice: 0,
    rating: product.averageRating, reviews: product.reviewCount,
    imageUrl: resolveImageUrl(product.mainImageUrl),
  });
  const recentlyViewed = localRecentViews.flatMap(item => {
    const product = recentProductsData?.find(product => product.id === item.id);
    return product ? [{ ...toHomeItem(product), badge: 'SON GEZDİĞİN' }] : [];
  });
  const bestSellers = dbProducts.slice(0, 4).map(toHomeItem);
  const personalizedOffers = dbProducts.slice(4, 8).map(toHomeItem);

  const renderProductGrid = (productsList: HomeProductItem[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {productsList.map((product) => (
        <Link
          key={product.id}
          to={`/products/${product.id}`}
          className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden card-shadow flex flex-col justify-between relative group"
        >
          {product.badge && (
            <div className="absolute top-3 left-3 z-10 bg-slate-900 text-white text-[9px] font-black tracking-wider px-2 py-0.5 rounded-md shadow-sm uppercase">
              {product.badge}
            </div>
          )}

          <button aria-label="Favorilere Ekle"
            onClick={(e) => toggleFavorite(product, e)}
            className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 shadow-sm transition-all border border-slate-100 active:scale-90"
            title="Favorilere Ekle"
          >
            <Heart className={`w-3.5 h-3.5 transition-colors ${checkIsFav(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          <div className="relative h-44 overflow-hidden bg-slate-50 flex items-center justify-center p-4">
            <SafeImage
              src={product.imageUrl}
              alt={product.title}
              className="max-h-full w-auto object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
            {product.coupon && (
              <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md text-center border border-orange-100/80 truncate">
                {product.coupon}
              </span>
            )}

            <h3 className="text-xs font-semibold text-slate-800 line-clamp-2 group-hover:text-orange-600 transition-colors leading-snug">
              {product.title}
            </h3>

            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-slate-800">{product.rating}</span>
              <span>({product.reviews})</span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                {product.oldPrice > 0 && (
                  <span className="text-[10px] text-slate-400 line-through block">
                    {product.oldPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                  </span>
                )}
                <span className="text-sm font-bold text-slate-900">
                  {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-xs font-bold">TL</span>
                </span>
              </div>

              <button aria-label="Sepete Ekle"
                onClick={(e) => handleAddToCart(product.id, e)}
                className={`p-2 rounded-xl transition-all active:scale-95 shadow-sm ${addedCartItems[product.id] ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-orange-500 text-slate-700 hover:text-white'
                  }`}
                title="Sepete Ekle"
              >
                <ShoppingBag className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="space-y-10 pb-16">
      {isLoading && <p role="status" className="text-sm text-slate-500">Ürünler yükleniyor...</p>}
      {isError && <p role="alert" className="text-sm text-rose-600">Ürünler yüklenemedi. <button type="button" onClick={() => refetch()}>Tekrar dene</button></p>}

      {/* 1. Popüler Kategoriler (Trendyol Stili Dairesel İkonlar) */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Kategorileri Keşfet</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {featuredCategories.map((category, idx) => {
            const IconComponent = category.icon;
            return (
              <Link
                key={idx}
                to={category.id ? `/products?categoryId=${category.id}` : '/products'}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col items-center justify-center text-center gap-3 hover:border-orange-500/30 transition-all group"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${category.color} flex items-center justify-center text-white shadow-md ${category.shadow} group-hover:scale-105 transition-transform`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 leading-snug group-hover:text-orange-600 transition-colors">
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 2. Son Gezdiğin Ürünler (Yalnızca gerçekten gezilmiş ürün varsa gösterilir - Trendyol/Amazon Mantığı) */}
      {localRecentViews.length > 0 && (
        <section className="space-y-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-6 bg-orange-500 rounded-full" />
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Son Gezdiğin Ürünler</h2>
                <p className="text-xs text-slate-500">İncelediğiniz ürünleri kaldığınız yerden takip edin</p>
              </div>
            </div>
            <Link to="/products" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1">
              <span>Tüm Kataloğu İncele</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {isRecentError ? <p role="alert" className="text-rose-600 text-xs">Son gezilen ürünler yüklenemedi. <button onClick={() => void refetchRecent()}>Tekrar dene</button></p> : isRecentLoading ? <p>Ürünler yükleniyor...</p> : renderProductGrid(recentlyViewed)}
        </section>
      )}

      {/* 3. Çok Satan Fırsat Ürünleri (Hepsiburada / Trendyol Çok Satanlar) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-6 bg-amber-500 rounded-full" />
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Yeni Ürünler</h2>
              <p className="text-xs text-slate-500">Kullanıcıların bu hafta en çok sipariş verdiği popüler ürünler</p>
            </div>
          </div>
          <Link to="/products" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1">
            <span>Tümünü Gör</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {renderProductGrid(bestSellers)}
      </section>

      {/* 4. Sana Özel Öneriler */}
      {personalizedOffers.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-6 bg-rose-500 rounded-full" />
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Katalogdan Seçilenler</h2>
                <p className="text-xs text-slate-500">Ürün kataloğumuzdan seçilen modeller</p>
              </div>
            </div>
            <Link to="/products" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1">
              <span>Tümünü Gör</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {renderProductGrid(personalizedOffers)}
        </section>
      )}

    </div>
  );
};
