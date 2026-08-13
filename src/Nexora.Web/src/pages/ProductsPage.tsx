import { useFavorites } from '../context/FavoritesContext';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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

export const ProductsPage: React.FC = () => {
  const { toggleFavorite: toggleFavStore, isFavorite: checkIsFav } = useFavorites();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [brandSearch, setBrandSearch] = useState<string>('');
  

  const [addedCartItems, setAddedCartItems] = useState<{ [key: string]: boolean }>({});

  const toggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const product = mockProducts.find(p => p.id === productId); if (product) toggleFavStore({ id: product.id, title: product.title, price: product.price, oldPrice: product.oldPrice, image: product.imageUrl });
  };

  const handleAddToCart = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddedCartItems(prev => ({ ...prev, [productId]: true }));
    setTimeout(() => {
      setAddedCartItems(prev => ({ ...prev, [productId]: false }));
    }, 2000);
  };

  const mockProducts = [
    {
      id: '1',
      title: 'Nexora Pro Wireless Bluetooth Kulaklık Çevre Gürültü Engelleyici',
      category: 'Elektronik',
      brand: 'Nexora Tech',
      price: 1499.90,
      oldPrice: 1999.00,
      discount: '%25 İndirim',
      rating: 4.8,
      reviews: 342,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
      badge: 'Çok Satan'
    },
    {
      id: '2',
      title: 'Erkek Premium Slim Fit Pamuklu Kumaş Gömlek',
      category: 'Moda & Giyim',
      brand: 'Nexora Wear',
      price: 599.00,
      oldPrice: 850.00,
      discount: '%30 İndirim',
      rating: 4.6,
      reviews: 128,
      imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&q=80',
      badge: 'Fırsat Ürünü'
    },
    {
      id: '3',
      title: 'Akıllı Saat GPS + Nabız Ölçer Su Geçirmez Spor Kordonlu',
      category: 'Elektronik',
      brand: 'Nexora Tech',
      price: 2299.00,
      oldPrice: 2899.00,
      discount: '%20 İndirim',
      rating: 4.9,
      reviews: 512,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
      badge: 'Kargo Bedava'
    },
    {
      id: '4',
      title: 'Ortopedik Koşu ve Yürüyüş Spor Ayakkabısı',
      category: 'Spor & Outdoor',
      brand: 'RunnerPro',
      price: 1249.50,
      oldPrice: 1699.00,
      discount: '%26 İndirim',
      rating: 4.7,
      reviews: 210,
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
      badge: 'Çok Satan'
    },
    {
      id: '5',
      title: 'Ergonomik Bel Destekli Yönetici Çalışma Koltuğu',
      category: 'Ev, Yaşam & Mobilya',
      brand: 'ComfortHome',
      price: 3499.00,
      oldPrice: 4200.00,
      discount: '%17 İndirim',
      rating: 4.5,
      reviews: 89,
      imageUrl: 'https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?w=500&q=80',
      badge: 'Yeni Ürün'
    },
    {
      id: '6',
      title: 'Organik Yüz Bakım Serumu Cilt Yenileyici 50ml',
      category: 'Kozmetik & Kişisel Bakım',
      brand: 'PureCare',
      price: 389.90,
      oldPrice: 499.00,
      discount: '%22 İndirim',
      rating: 4.9,
      reviews: 420,
      imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80',
      badge: 'Popüler'
    }
  ];

  const categories = [
    { id: 'all', name: 'Tüm Kategoriler', count: 128 },
    { id: 'elektronik', name: 'Elektronik', count: 42 },
    { id: 'moda', name: 'Moda & Giyim', count: 35 },
    { id: 'ev-yasam', name: 'Ev, Yaşam & Mobilya', count: 24 },
    { id: 'kozmetik', name: 'Kozmetik & Kişisel Bakım', count: 18 },
    { id: 'spor', name: 'Spor & Outdoor', count: 15 }
  ];

  const brands = ['Nexora Tech', 'Nexora Wear', 'RunnerPro', 'ComfortHome', 'PureCare', 'Apple', 'Samsung', 'Nike'];

  return (
    <div className="space-y-6 pb-16">
      
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/" className="hover:text-orange-600 transition-colors">Ana Sayfa</Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-900 font-bold">Ürün Kataloğu</span>
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
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-orange-50 text-orange-600 font-bold border border-orange-200/80'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{cat.count}</span>
                  </button>
                ))}
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
              <button className="w-full py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors">
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
                {brands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase())).map((brand, idx) => (
                  <label key={idx} className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 hover:text-orange-600 font-medium">
                    <input type="checkbox" className="w-3.5 h-3.5 text-orange-500 rounded border-slate-300 focus:ring-orange-500" />
                    <span>{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200/80" />

            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Müşteri Puanı</h4>
              {[4, 3, 2].map((star) => (
                <label key={star} className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                  <input type="checkbox" className="w-3.5 h-3.5 text-orange-500 rounded border-slate-300 focus:ring-orange-500" />
                  <div className="flex items-center text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="font-bold text-slate-800 ml-1">{star} Yıldız ve Üzeri</span>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={() => { setSelectedCategory('all'); setMinPrice(''); setMaxPrice(''); }}
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
              <p className="text-xs text-slate-500 font-medium">128 ürün bulundu</p>
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
                  <option value="newest">En Yeniler</option>
                  <option value="best-sellers">En Çok Satanlar</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProducts.map((product) => (
              <a
                key={product.id}
                href={`/products/${product.id}`}
                className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden card-shadow flex flex-col justify-between relative group"
              >
                {/* İNTERAKTİF FAVORİ KALBİ */}
                <button
                  onClick={(e) => toggleFavorite(product.id, e)}
                  className="absolute top-3 right-3 z-10 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 shadow-sm transition-all border border-slate-100 active:scale-90"
                  title="Favorilere Ekle"
                >
                  <Heart className={`w-4 h-4 transition-colors ${checkIsFav(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>

                <div className="relative h-56 overflow-hidden bg-slate-50 flex items-center justify-center p-4">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute bottom-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                    {product.discount}
                  </span>
                  <span className="absolute top-3 left-3 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {product.badge}
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{product.category}</span>
                    <h3 className="text-xs font-semibold text-slate-800 line-clamp-2 group-hover:text-orange-600 transition-colors leading-snug">
                      {product.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <div className="flex items-center text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span className="font-semibold text-slate-800 ml-1 text-xs">{product.rating}</span>
                    </div>
                    <span>({product.reviews})</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 line-through block">
                        {product.oldPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                      </span>
                      <span className="text-base font-bold text-slate-900">
                        {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-xs font-bold">TL</span>
                      </span>
                    </div>

                    {/* İNTERAKTİF SEPETE EKLE BUTONU */}
                    <button
                      onClick={(e) => handleAddToCart(product.id, e)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm ${
                        addedCartItems[product.id]
                          ? 'bg-emerald-600 text-white'
                          : 'bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{addedCartItems[product.id] ? 'Eklendi!' : 'Ekle'}</span>
                    </button>
                  </div>
                </div>
              </a>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 pt-6">
            <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 disabled:opacity-40" disabled>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="w-9 h-9 bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20">
              1
            </button>
            <button className="w-9 h-9 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl">
              2
            </button>
            <button className="w-9 h-9 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl">
              3
            </button>
            <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

        </main>
      </div>
    </div>
  );
};
