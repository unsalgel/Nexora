import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Heart, 
  Star, 
  ArrowRight, 
  Laptop,
  Shirt,
  Home,
  Watch,
  Dumbbell,
  Zap,
  Flower2,
  LayoutGrid,
  ChevronRight
} from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';

export const HomePage: React.FC = () => {
  const { toggleFavorite: toggleFavStore, isFavorite: checkIsFav } = useFavorites();
  const [addedCartItems, setAddedCartItems] = useState<{ [key: string]: boolean }>({});

  const toggleFavorite = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavStore({ id: product.id, title: product.title, price: product.price, oldPrice: product.oldPrice, image: product.imageUrl });
  };

  const handleAddToCart = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddedCartItems(prev => ({ ...prev, [productId]: true }));
    setTimeout(() => {
      setAddedCartItems(prev => ({ ...prev, [productId]: false }));
    }, 2000);
  };

  const featuredCategories = [
    { name: 'Süper Fırsatlar', icon: Zap, color: 'from-orange-500 to-amber-500', shadow: 'shadow-orange-500/20' },
    { name: 'Elektronik', icon: Laptop, color: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
    { name: 'Moda & Giyim', icon: Shirt, color: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-500/20' },
    { name: 'Ev & Yaşam', icon: Home, color: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20' },
    { name: 'Kozmetik', icon: Flower2, color: 'from-purple-500 to-violet-500', shadow: 'shadow-purple-500/20' },
    { name: 'Spor & Outdoor', icon: Dumbbell, color: 'from-amber-500 to-yellow-500', shadow: 'shadow-amber-500/20' },
    { name: 'Aksesuar', icon: Watch, color: 'from-indigo-500 to-blue-500', shadow: 'shadow-indigo-500/20' },
    { name: 'Tüm Kategoriler', icon: LayoutGrid, color: 'from-slate-600 to-slate-800', shadow: 'shadow-slate-500/20' }
  ];

  const recentlyViewed = [
    {
      id: '1',
      title: 'Nexora Pro Wireless Bluetooth Kulaklık Çevre Gürültü Engelleyici',
      price: 1499.90,
      oldPrice: 1999.00,
      rating: 4.8,
      reviews: 342,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
      badge: 'AVANTAJLI',
      coupon: 'Ek 200 TL Kupon'
    },
    {
      id: '3',
      title: 'Akıllı Saat GPS + Nabız Ölçer Su Geçirmez Spor Kordonlu',
      price: 2299.00,
      oldPrice: 2899.00,
      rating: 4.9,
      reviews: 512,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
      badge: 'AVANTAJLI',
      coupon: 'Peşin Fiyatına 3 Taksit'
    },
    {
      id: '4',
      title: 'Ortopedik Koşu ve Yürüyüş Spor Ayakkabısı',
      price: 1249.50,
      oldPrice: 1699.00,
      rating: 4.7,
      reviews: 210,
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
      badge: 'SÜPER FİYAT',
      coupon: 'Sepette %10 İndirim'
    },
    {
      id: '6',
      title: 'Organik Yüz Bakım Serumu Cilt Yenileyici 50ml',
      price: 389.90,
      oldPrice: 499.00,
      rating: 4.9,
      reviews: 420,
      imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80',
      badge: 'AVANTAJLI',
      coupon: 'Ek 50 TL Kupon'
    }
  ];

  const personalizedOffers = [
    {
      id: '2',
      title: 'Erkek Premium Slim Fit Pamuklu Kumaş Gömlek',
      price: 599.00,
      oldPrice: 850.00,
      rating: 4.6,
      reviews: 128,
      imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&q=80',
      coupon: 'Sana Özel %20 İndirim'
    },
    {
      id: '5',
      title: 'Ergonomik Bel Destekli Yönetici Çalışma Koltuğu',
      price: 3499.00,
      oldPrice: 4200.00,
      rating: 4.5,
      reviews: 89,
      imageUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=500&q=80',
      coupon: 'Peşin Fiyatına 6 Taksit'
    },
    {
      id: '1',
      title: 'Nexora Pro Wireless Bluetooth Kulaklık ANC',
      price: 1499.90,
      oldPrice: 1999.00,
      rating: 4.8,
      reviews: 342,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
      coupon: 'Kargo Bedava'
    },
    {
      id: '3',
      title: 'Akıllı Saat GPS + Nabız Ölçer Spor Kordonlu',
      price: 2299.00,
      oldPrice: 2899.00,
      rating: 4.9,
      reviews: 512,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
      coupon: 'Ek 100 TL İndirim'
    }
  ];

  const renderProductGrid = (productsList: any[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {productsList.map((product) => (
        <a
          key={product.id}
          href={`/products/${product.id}`}
          className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden card-shadow flex flex-col justify-between relative group"
        >
          {product.badge && (
            <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black tracking-wider px-2 py-0.5 rounded-md shadow-sm uppercase">
              ★ {product.badge}
            </div>
          )}

          <button
            onClick={(e) => toggleFavorite(product, e)}
            className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 shadow-sm transition-all border border-slate-100 active:scale-90"
            title="Favorilere Ekle"
          >
            <Heart className={`w-3.5 h-3.5 transition-colors ${checkIsFav(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          <div className="relative h-44 overflow-hidden bg-slate-50 flex items-center justify-center p-4">
            <img src={product.imageUrl} alt={product.title} className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300" />
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
                {product.oldPrice && (
                  <span className="text-[10px] text-slate-400 line-through block">
                    {product.oldPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                  </span>
                )}
                <span className="text-sm font-bold text-slate-900">
                  {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-xs font-bold">TL</span>
                </span>
              </div>

              <button
                onClick={(e) => handleAddToCart(product.id, e)}
                className={`p-2 rounded-xl transition-all active:scale-95 shadow-sm ${
                  addedCartItems[product.id] ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-orange-500 text-slate-700 hover:text-white'
                }`}
                title="Sepete Ekle"
              >
                <ShoppingBag className="w-4 h-4" />
              </button>
            </div>

          </div>
        </a>
      ))}
    </div>
  );

  return (
    <div className="space-y-10 pb-16">
      
      {/* 1. Popüler Kategoriler */}
      <section className="space-y-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5"><div className="w-1 h-5 bg-orange-500 rounded-full" /><h2 className="text-base font-bold text-slate-900 tracking-tight">Popüler Kategorileri Keşfet</h2></div>
            <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" /> Öne Çıkanlar
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4">
            {featuredCategories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <a
                  key={idx}
                  href="/products"
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className={`w-14 h-14 sm:w-[68px] sm:h-[68px] rounded-2xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center ${cat.shadow} shadow-md group-hover:-translate-y-2 group-hover:shadow-lg transition-all duration-300`}>
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.8} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-orange-600 transition-colors text-center line-clamp-1">
                    {cat.name}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. Kampanya Banners */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[200px] shadow-lg shadow-orange-500/15">
          <div className="space-y-2 max-w-md z-10">
            <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase">
              ⚡ Mega İndirim Günleri
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Teknoloji & Modada %50'ye Varan İndirimler!</h2>
          </div>
          <div className="pt-4 z-10">
            <a href="/products" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs shadow-md transition-transform active:scale-95">
              <span>Fırsatları Keşfet</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="md:col-span-4 bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between min-h-[200px] shadow-lg">
          <div className="space-y-2 z-10">
            <span className="text-orange-400 text-xs font-bold uppercase tracking-wider block">Günün Fırsatı</span>
            <h3 className="text-xl font-bold tracking-tight">Kablosuz Ses Sistemlerinde Özel Fiyatlar</h3>
          </div>
          <div className="pt-4 z-10">
            <a href="/products" className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition-transform active:scale-95">
              <span>Hemen İncele</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* 3. VİTRİN: Son Gezdiğin Ürünler */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Son Gezdiğin Ürünler</h2>
          <a href="/products" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1">
            <span>Tümünü Gör</span>
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
        {renderProductGrid(recentlyViewed)}
      </section>

      {/* 4. VİTRİN: Ünsal, Sana Özel Öneriler */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Ünsal, Sana Özel Öneriler</h2>
          <a href="/products" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1">
            <span>Tümü</span>
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
        {renderProductGrid(personalizedOffers)}
      </section>

      {/* 5. VİTRİN: En Avantajlı Ürünler */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">En Avantajlı Ürünler</h2>
          <a href="/products" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1">
            <span>Tümünü Gör</span>
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
        {renderProductGrid(recentlyViewed)}
      </section>

      {/* 6. VİTRİN: İhtiyacın Olabilecek Ürünler */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">İhtiyacın Olabilecek Ürünler</h2>
          <a href="/products" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1">
            <span>Tümünü Gör</span>
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
        {renderProductGrid(personalizedOffers)}
      </section>

      {/* E-Bülten Abone Alanı */}
      <section className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="text-xl font-bold tracking-tight">Fırsatları Kaçırmayın!</h3>
          <p className="text-xs text-slate-400 font-medium">E-bültenimize kaydolun, ilk alışverişinize özel 100 TL indirim kazanın.</p>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="flex w-full md:w-auto gap-2">
          <input
            type="email"
            placeholder="E-posta adresiniz..."
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 w-full sm:w-64"
          />
          <button type="submit" className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 shrink-0">
            Abone Ol
          </button>
        </form>
      </section>

    </div>
  );
};
