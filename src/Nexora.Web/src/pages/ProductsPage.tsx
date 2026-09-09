import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Filter, 
  ChevronDown, 
  Star, 
  Heart, 
  ShoppingBag, 
  Search, 
  SlidersHorizontal, 
  X, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';
import { apiClient } from '../lib/apiClient';
import type { ApiResponse, PagedResponse } from '../lib/apiClient';
import { resolveImageUrl } from '../lib/imageUtils';

interface CategoryDto {
  id: string;
  name: string;
  description?: string;
}

interface BrandDto {
  id: string;
  name: string;
}

interface ProductListDto {
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

export const ProductsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const urlCategoryId = searchParams.get('categoryId') || 'all';

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(urlCategoryId);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>(urlSearch);
  const [searchInputValue, setSearchInputValue] = useState<string>(urlSearch);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [appliedMinPrice, setAppliedMinPrice] = useState<string>('');
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [brandSearch, setBrandSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    setSearchTerm(urlSearch);
    setSearchInputValue(urlSearch);
    setPage(1);
  }, [urlSearch]);

  useEffect(() => {
    setSelectedCategoryId(urlCategoryId);
    setPage(1);
  }, [urlCategoryId]);

  const { toggleFavorite: toggleFavStore, isFavorite: checkIsFav } = useFavorites();
  const { addToCart } = useCart();
  const [addedCartItems, setAddedCartItems] = useState<{ [key: string]: boolean }>({});

  const { data: categoriesData } = useQuery<ApiResponse<CategoryDto[]>>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<CategoryDto[]>>('/categories');
      return response.data;
    }
  });

  const { data: brandsData } = useQuery<ApiResponse<BrandDto[]>>({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<BrandDto[]>>('/brands');
      return response.data;
    }
  });

  const { data: productsData, isLoading } = useQuery<ApiResponse<PagedResponse<ProductListDto>>>({
    queryKey: ['products', page, selectedCategoryId, selectedBrandId, searchTerm, sortBy],
    queryFn: async () => {
      const params: Record<string, string | number | boolean | undefined> = {
        page,
        pageSize: 9,
        isActive: true,
      };
      if (selectedCategoryId !== 'all') params.categoryId = selectedCategoryId;
      if (selectedBrandId !== 'all') params.brandId = selectedBrandId;
      if (searchTerm) params.searchTerm = searchTerm;

      const response = await apiClient.get<ApiResponse<PagedResponse<ProductListDto>>>('/products', { params });
      return response.data;
    }
  });

  const categories = categoriesData?.data || [];
  const brands = brandsData?.data || [];
  const pagedProducts = productsData?.data;
  const products = pagedProducts?.items || [];

  const filteredProducts = React.useMemo(() => {
    let result = [...products];
    if (appliedMinPrice !== '') {
      result = result.filter(p => p.price >= parseFloat(appliedMinPrice));
    }
    if (appliedMaxPrice !== '') {
      result = result.filter(p => p.price <= parseFloat(appliedMaxPrice));
    }
    
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    }
    return result;
  }, [products, appliedMinPrice, appliedMaxPrice, sortBy]);

  const handleApplyPrice = () => {
    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
  };

  const handleResetFilters = () => {
    setSelectedCategoryId('all');
    setSelectedBrandId('all');
    setSearchTerm('');
    setSearchInputValue('');
    setMinPrice('');
    setMaxPrice('');
    setAppliedMinPrice('');
    setAppliedMaxPrice('');
    setSortBy('featured');
    setPage(1);
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

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/" className="hover:text-orange-600 transition-colors">Ana Sayfa</Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-900 font-bold">Ürün Kataloğu</span>
        {searchTerm && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-orange-600 font-bold">"{searchTerm}" Arama Sonuçları</span>
          </>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className={`
          lg:w-64 shrink-0 
          ${isMobileFilterOpen ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto block' : 'hidden lg:block'}
        `}>
          <div className="flex items-center justify-between lg:hidden border-b border-slate-200 pb-4 mb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Filter className="w-5 h-5 text-orange-500" />
              <span>Filtrele</span>
            </h3>
            <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 text-slate-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Kategoriler</h4>
              <div className="space-y-1.5">
                <button
                  onClick={() => { setSelectedCategoryId('all'); setPage(1); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    selectedCategoryId === 'all'
                      ? 'bg-orange-50 text-orange-600 font-bold border border-orange-200/80'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>Tüm Kategoriler</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategoryId(cat.id); setPage(1); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      selectedCategoryId === cat.id
                        ? 'bg-orange-50 text-orange-600 font-bold border border-orange-200/80'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200/80" />

            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Ürün Ara</h4>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Katalogda ara..."
                  value={searchInputValue}
                  onChange={(e) => setSearchInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSearchTerm(searchInputValue);
                      setPage(1);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
                />
                <button 
                  onClick={() => { setSearchTerm(searchInputValue); setPage(1); }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-orange-500"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200/80" />

            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Fiyat Aralığı (TL)</h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
                />
              </div>
              <button 
                onClick={handleApplyPrice}
                className="w-full py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors"
              >
                Fiyat Uygula
              </button>
            </div>

            <div className="border-t border-slate-200/80" />

            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Markalar</h4>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Marka ara..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                <button
                  onClick={() => { setSelectedBrandId('all'); setPage(1); }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold ${
                    selectedBrandId === 'all' ? 'text-orange-600 font-bold bg-orange-50/50' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Tüm Markalar
                </button>
                {brands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase())).map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => { setSelectedBrandId(brand.id); setPage(1); }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold ${
                      selectedBrandId === brand.id ? 'text-orange-600 font-bold bg-orange-50/50' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200/80" />

            <button
              onClick={handleResetFilters}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Filtreleri Sıfırla
            </button>
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Ürün Kataloğu</h1>
              <p className="text-xs text-slate-500 font-medium">
                {isLoading ? 'Yükleniyor...' : `${pagedProducts?.totalCount || 0} ürün bulundu`}
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3">
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4 text-orange-500" />
                <span>Filtrele</span>
              </button>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 pr-8 text-xs font-bold text-slate-700 appearance-none focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="featured">Akıllı Sıralama (Önerilen)</option>
                  <option value="price-asc">Fiyat: Düşükten Yükseğe</option>
                  <option value="price-desc">Fiyat: Yüksekten Düşüğe</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(n => (
                <div key={n} className="bg-white rounded-2xl border border-slate-150 p-4 space-y-4 animate-pulse">
                  <div className="h-48 bg-slate-100 rounded-xl w-full" />
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center space-y-3">
              <p className="text-xs text-slate-500 font-medium">Aradığınız kriterlere uygun ürün bulunamadı.</p>
              <button 
                onClick={handleResetFilters}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Filtreleri Temizle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden card-shadow flex flex-col justify-between relative group"
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavStore({ 
                        id: product.id, 
                        title: product.name, 
                        price: product.price, 
                        oldPrice: product.price * 1.25, 
                        image: resolveImageUrl(product.mainImageUrl)
                      });
                    }}
                    className="absolute top-3 right-3 z-10 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 shadow-sm transition-all border border-slate-100 active:scale-90"
                    title="Favorilere Ekle"
                  >
                    <Heart className={`w-4 h-4 transition-colors ${checkIsFav(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  <div className="relative h-56 overflow-hidden bg-slate-50 flex items-center justify-center p-4">
                    <img
                      src={resolveImageUrl(product.mainImageUrl)}
                      alt={product.name}
                      className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{product.categoryName}</span>
                      <h3 className="text-xs font-semibold text-slate-800 line-clamp-2 group-hover:text-orange-600 transition-colors leading-snug">
                        {product.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <div className="flex items-center text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-slate-800 ml-1 text-xs">4.8</span>
                      </div>
                      <span>(120)</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 line-through block">
                          {(product.price * 1.25).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                        </span>
                        <span className="text-base font-bold text-slate-900">
                          {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-xs font-bold">TL</span>
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleAddToCart(product.id, e)}
                        className={`p-2 rounded-xl transition-all active:scale-95 shadow-sm ${
                          addedCartItems[product.id]
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 hover:bg-orange-500 text-slate-700 hover:text-white'
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
          )}

          {pagedProducts && pagedProducts.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button 
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={!pagedProducts.hasPreviousPage}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 disabled:opacity-40"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: pagedProducts.totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPage(idx + 1)}
                  className={`w-9 h-9 font-bold text-xs rounded-xl ${
                    page === idx + 1 
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                      : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button 
                onClick={() => setPage(prev => Math.min(prev + 1, pagedProducts.totalPages))}
                disabled={!pagedProducts.hasNextPage}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 disabled:opacity-40"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
