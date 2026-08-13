import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Grid,
  Clock,
  Zap,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones
} from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';

export const HomePage: React.FC = () => {
  const { toggleFavorite: toggleFavStore, isFavorite: checkIsFav } = useFavorites();
  const [addedCartItems, setAddedCartItems] = useState<{ [key: string]: boolean }>({});

  // Flaş İndirim Canlı Sayaç (Geri Sayım)
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 28, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
    { name: 'Süper Fırsatlar', icon: Sparkles, color: 'from-orange-500 to-amber-500' },
    { name: 'Elektronik', icon: Laptop, color: 'from-blue-500 to-cyan-500' },
    { name: 'Moda & Giyim', icon: Shirt, color: 'from-pink-500 to-rose-500' },
    { name: 'Ev & Yaşam', icon: Home, color: 'from-emerald-500 to-teal-500' },
    { name: 'Kozmetik', icon: Sparkles, color: 'from-purple-500 to-indigo-500' },
    { name: 'Spor & Outdoor', icon: Dumbbell, color: 'from-amber-500 to-yellow-500' },
    { name: 'Aksesuar', icon: Watch, color: 'from-indigo-500 to-blue-500' },
    { name: 'Tüm Kategoriler', icon: Grid, color: 'from-slate-700 to-slate-900' }
  ];

  const flashDeals = [
    {
      id: '1',
      title: 'Nexora Pro Wireless Bluetooth Kulaklık Çevre Gürültü Engelleyici',
      category: 'Elektronik',
      price: 1499.90,
      oldPrice: 1999.00,
      discount: '%25 İndirim',
      rating: 4.8,
      reviews: 342,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'
    },
    {
      id: '3',
      title: 'Akıllı Saat GPS + Nabız Ölçer Su Geçirmez Spor Kordonlu',
      category: 'Elektronik',
      price: 2299.00,
      oldPrice: 2899.00,
      discount: '%20 İndirim',
      rating: 4.9,
      reviews: 512,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'
    },
    {
      id: '6',
      title: 'Organik Yüz Bakım Serumu Cilt Yenileyici 50ml',
      category: 'Kozmetik',
      price: 389.90,
      oldPrice: 499.00,
      discount: '%22 İndirim',
      rating: 4.9,
      reviews: 420,
      imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80'
    },
    {
      id: '4',
      title: 'Ortopedik Koşu ve Yürüyüş Spor Ayakkabısı',
      category: 'Spor & Outdoor',
      price: 1249.50,
      oldPrice: 1699.00,
      discount: '%26 İndirim',
      rating: 4.7,
      reviews: 210,
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80'
    }
  ];

  const bestSellers = [
    {
      id: '2',
      title: 'Erkek Premium Slim Fit Pamuklu Kumaş Gömlek',
      category: 'Moda & Giyim',
      price: 599.00,
      oldPrice: 850.00,
      discount: '%30 İndirim',
      rating: 4.6,
      reviews: 128,
      imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&q=80'
    },
    {
      id: '5',
      title: 'Ergonomik Bel Destekli Yönetici Çalışma Koltuğu',
      category: 'Ev & Yaşam',
      price: 3499.00,
      oldPrice: 4200.00,
      discount: '%17 İndirim',
      rating: 4.5,
      reviews: 89,
      imageUrl: 'https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?w=500&q=80'
    },
    {
      id: '1',
      title: 'Nexora Pro Wireless Bluetooth Kulaklık Çevre Gürültü Engelleyici',
      category: 'Elektronik',
      price: 1499.90,
      oldPrice: 1999.00,
      discount: '%25 İndirim',
      rating: 4.8,
      reviews: 342,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'
    },
    {
      id: '4',
      title: 'Ortopedik Koşu ve Yürüyüş Spor Ayakkabısı',
      category: 'Spor & Outdoor',
      price: 1249.50,
      oldPrice: 1699.00,
      discount: '%26 İndirim',
      rating: 4.7,
      reviews: 210,
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80'
    }
  ];

  const popularBrands = [
    { name: 'Nexora Tech', logo: 'NXR' },
    { name: 'Apple', logo: '🍎' },
    { name: 'Samsung', logo: 'SAMSUNG' },
    { name: 'Nike', logo: 'NIKE' },
    { name: 'Puma', logo: 'PUMA' },
    { name: 'Philips', logo: 'PHILIPS' }
  ];

  return (
    <div className="space-y-10 pb-16">
      
      {/* Popüler Kategoriler */}
      <section className="space-y-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Popüler Kategorileri Keşfet</h2>
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
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr ${cat.color} text-white flex items-center justify-center shadow-sm group-hover:-translate-y-1.5 transition-all duration-300`}>
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
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

      {/* İkili Öne Çıkan Kampanya Banners */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-lg shadow-orange-500/15">
          <div className="space-y-2 max-w-md z-10">
            <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase">
              ⚡ Mega İndirim Günleri
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Teknoloji & Modada %50'ye Varan İndirimler!</h2>
            <p className="text-xs text-orange-100 font-medium">Stoklarla sınırlı sepette ek %10 indirim fırsatını kaçırmayın.</p>
          </div>
          <div className="pt-4 z-10">
            <a href="/products" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs shadow-md transition-transform active:scale-95">
              <span>Fırsatları Keşfet</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="md:col-span-4 bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-lg">
          <div className="space-y-2 z-10">
            <span className="text-orange-400 text-xs font-bold uppercase tracking-wider block">Günün Fırsatı</span>
            <h3 className="text-xl font-bold tracking-tight">Kablosuz Ses Sistemlerinde Özel Fiyatlar</h3>
            <p className="text-xs text-slate-400 font-medium">Tüm kulaklık modellerinde geçerli kargo bedava indirimi.</p>
          </div>
          <div className="pt-4 z-10">
            <a href="/products" className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition-transform active:scale-95">
              <span>Hemen İncele</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* VİTRİN 1: FLAŞ İNDİRİMLER (Canlı Sayaçlı) */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Flaş İndirimler</h2>
              <p className="text-xs text-slate-500 font-medium">Sınırlı süre için kaçırılmayacak süper fiyatlar</p>
            </div>
          </div>

          {/* Geri Sayım Sayacı */}
          <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-2xl text-xs font-mono font-bold self-start sm:self-auto">
            <Clock className="w-4 h-4 text-orange-400" />
            <span>Bitmesine:</span>
            <span className="text-orange-400">{String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {flashDeals.map((product) => (
            <a
              key={product.id}
              href={`/products/${product.id}`}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden card-shadow flex flex-col justify-between relative group"
            >
              <button
                onClick={(e) => toggleFavorite(product, e)}
                className="absolute top-3 right-3 z-10 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 shadow-sm transition-all border border-slate-100 active:scale-90"
              >
                <Heart className={`w-4 h-4 transition-colors ${checkIsFav(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>

              <div className="relative h-48 overflow-hidden bg-slate-50 flex items-center justify-center p-4">
                <img src={product.imageUrl} alt={product.title} className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                <span className="absolute bottom-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                  {product.discount}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{product.category}</span>
                  <h3 className="text-xs font-semibold text-slate-800 line-clamp-2 group-hover:text-orange-600 transition-colors leading-snug">{product.title}</h3>
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
                    <span className="text-[11px] text-slate-400 line-through block">{product.oldPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                    <span className="text-base font-bold text-slate-900">{product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-xs font-bold">TL</span></span>
                  </div>

                  <button
                    onClick={(e) => handleAddToCart(product.id, e)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm ${
                      addedCartItems[product.id] ? 'bg-emerald-600 text-white' : 'bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white'
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
      </section>

      {/* POPÜLER MARKALAR ŞERİDİ */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">Öne Çıkan Markalar</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {popularBrands.map((b, idx) => (
            <a key={idx} href="/products" className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 hover:border-orange-500 transition-all card-shadow">
              <span className="font-black text-sm text-slate-800 tracking-wider">{b.logo}</span>
              <span className="text-[10px] text-slate-400 font-semibold">{b.name}</span>
            </a>
          ))}
        </div>
      </section>

      {/* VİTRİN 2: ÇOK SATANLAR */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Çok Satan Ürünler</h2>
            <p className="text-xs text-slate-500 font-medium">Kullanıcılarımızın en çok tercih ettiği ürünler</p>
          </div>
          <a href="/products" className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors">
            <span>Tümünü Gör</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map((product) => (
            <a
              key={product.id}
              href={`/products/${product.id}`}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden card-shadow flex flex-col justify-between relative group"
            >
              <button
                onClick={(e) => toggleFavorite(product, e)}
                className="absolute top-3 right-3 z-10 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 shadow-sm transition-all border border-slate-100 active:scale-90"
              >
                <Heart className={`w-4 h-4 transition-colors ${checkIsFav(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>

              <div className="relative h-48 overflow-hidden bg-slate-50 flex items-center justify-center p-4">
                <img src={product.imageUrl} alt={product.title} className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                <span className="absolute bottom-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                  {product.discount}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{product.category}</span>
                  <h3 className="text-xs font-semibold text-slate-800 line-clamp-2 group-hover:text-orange-600 transition-colors leading-snug">{product.title}</h3>
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
                    <span className="text-[11px] text-slate-400 line-through block">{product.oldPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                    <span className="text-base font-bold text-slate-900">{product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-xs font-bold">TL</span></span>
                  </div>

                  <button
                    onClick={(e) => handleAddToCart(product.id, e)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm ${
                      addedCartItems[product.id] ? 'bg-emerald-600 text-white' : 'bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white'
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
      </section>

      {/* GÜVENLİK VE HİZMET AVANTAJLARI (FOOTER ÜSTÜ) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Hızlı Kargo</h4>
            <p className="text-[10px] text-slate-500 font-medium">500 TL üzeri kargo bedava</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Orijinal Ürün</h4>
            <p className="text-[10px] text-slate-500 font-medium">%100 Orijinal garantili</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">14 Gün İade</h4>
            <p className="text-[10px] text-slate-500 font-medium">Kolay iade imkanı</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">7/24 Destek</h4>
            <p className="text-[10px] text-slate-500 font-medium">Uzman destek ekibi</p>
          </div>
        </div>
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
