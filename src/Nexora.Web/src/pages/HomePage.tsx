import React from 'react';
import { 
  ArrowRight, 
  ShoppingBag, 
  Heart, 
  Star, 
  Flame, 
  Zap, 
  Sparkles, 
  Mail,
  Laptop,
  Shirt,
  Home,
  Sparkle,
  Dumbbell,
  Watch,
  Grid
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  
  const mockProducts = [
    {
      id: '1',
      title: 'Nexora Pro Wireless Bluetooth Kulaklık Çevre Gürültü Engelleyici',
      category: 'Elektronik',
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
      category: 'Moda',
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
      category: 'Spor',
      price: 1249.50,
      oldPrice: 1699.00,
      discount: '%26 İndirim',
      rating: 4.7,
      reviews: 210,
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
      badge: 'Çok Satan'
    }
  ];

  // Profesyonel İkonlar ve Renk Gradyanları
  const categoryBubbles = [
    { name: 'Süper Fırsatlar', icon: Flame, color: 'from-orange-500 to-amber-500 text-white shadow-orange-500/25' },
    { name: 'Elektronik', icon: Laptop, color: 'from-blue-500 to-cyan-500 text-white shadow-blue-500/25' },
    { name: 'Moda & Giyim', icon: Shirt, color: 'from-pink-500 to-rose-500 text-white shadow-pink-500/25' },
    { name: 'Ev & Yaşam', icon: Home, color: 'from-emerald-500 to-teal-500 text-white shadow-emerald-500/25' },
    { name: 'Kozmetik', icon: Sparkle, color: 'from-purple-500 to-indigo-500 text-white shadow-purple-500/25' },
    { name: 'Spor & Outdoor', icon: Dumbbell, color: 'from-amber-500 to-yellow-500 text-white shadow-amber-500/25' },
    { name: 'Aksesuar', icon: Watch, color: 'from-indigo-500 to-blue-600 text-white shadow-indigo-500/25' },
    { name: 'Tüm Kategoriler', icon: Grid, color: 'from-slate-700 to-slate-900 text-white shadow-slate-900/20' },
  ];

  return (
    <div className="space-y-10 pb-12">
      
      {/* 1. Ultra Şık Profesyonel Kategori Kart Konteyneri */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              Popüler Kategorileri Keşfet
            </h3>
          </div>
          <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200/60">
            Öne Çıkanlar
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 pt-1">
          {categoryBubbles.map((cat, idx) => {
            const IconComponent = cat.icon;
            return (
              <Link
                key={idx}
                to="/products"
                className="flex flex-col items-center gap-2.5 group cursor-pointer p-2 rounded-2xl hover:bg-slate-50 transition-all"
              >
                <div className={`w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-md group-hover:-translate-y-1.5 group-hover:scale-105 transition-all duration-300`}>
                  <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-700 group-hover:text-orange-600 transition-colors text-center line-clamp-1 leading-tight">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 2. Ana Kampanya Banner Alanı */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sol Büyük Banner */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-8 sm:p-12 text-white shadow-md flex flex-col justify-between min-h-[300px]">
          <div className="space-y-4 max-w-md">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-yellow-300" /> MEGA İNDİRİM GÜNLERİ
            </span>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">
              Teknoloji & Modada %50'ye Varan İndirimler!
            </h2>
            <p className="text-sm text-white/90 font-medium">
              Stoklarla sınırlı sepette ek %10 indirim fırsatını kaçırmayın.
            </p>
          </div>
          <div className="pt-6">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-sm"
            >
              Fırsatları Keşfet <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Sağ İkinci Banner */}
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-orange-950 text-white p-8 shadow-md flex flex-col justify-between relative border border-slate-800">
          <div className="space-y-3">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> GÜNÜN FIRSATI
            </span>
            <h3 className="text-2xl font-bold">Kablosuz Ses Sistemlerinde Özel Fiyatlar</h3>
            <p className="text-xs text-slate-300">Tüm kulaklık modellerinde geçerli kargo bedava indirimi.</p>
          </div>
          <div className="pt-6">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
            >
              Hemen İncele <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Çok Satan Ürünler Vitrini */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Çok Satan Ürünler</h3>
              <p className="text-xs text-slate-500">Kullanıcılarımızın en çok tercih ettiği popüler ürünler</p>
            </div>
          </div>

          <Link to="/products" className="text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1">
            Tümünü Gör <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Ürün Kartları Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden card-shadow flex flex-col justify-between relative group"
            >
              {/* Favori Butonu */}
              <button className="absolute top-3 right-3 z-10 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 shadow-sm transition-colors border border-slate-100">
                <Heart className="w-5 h-5" />
              </button>

              {/* Ürün Görseli */}
              <div className="relative h-56 overflow-hidden bg-slate-50 flex items-center justify-center p-4">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* İndirim Rozeti */}
                <span className="absolute bottom-3 left-3 bg-rose-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                  {product.discount}
                </span>

                {/* Özel Rozet */}
                <span className="absolute top-3 left-3 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {product.badge}
                </span>
              </div>

              {/* Ürün Detayları */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{product.category}</span>
                  <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 hover:text-orange-600 cursor-pointer transition-colors leading-snug">
                    {product.title}
                  </h4>
                </div>

                {/* Değerlendirme / Puan */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <div className="flex items-center text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="font-bold text-slate-800 ml-1 text-xs">{product.rating}</span>
                  </div>
                  <span>({product.reviews} değerlendirme)</span>
                </div>

                {/* Fiyat ve Sepete Ekle */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 line-through block font-medium">
                      {product.oldPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                    </span>
                    <span className="text-lg font-black text-slate-900">
                      {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-xs font-bold">TL</span>
                    </span>
                  </div>

                  <button className="px-3.5 py-2 bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Ekle</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. İndirim Kuponu Kutusu */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-850 to-orange-950 rounded-2xl p-8 sm:p-10 text-white flex flex-col lg:flex-row items-center justify-between gap-6 shadow-md border border-slate-800">
        <div className="space-y-2 text-center lg:text-left max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
            <Mail className="w-3.5 h-3.5" /> FIRSAT BÜLTENİ
          </span>
          <h3 className="text-2xl sm:text-3xl font-black">İlk Alışverişinizde 100 TL İndirim Kazanın!</h3>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            E-bültenimize abone olun, haftalık gizli indirimler ve özel kampanya kuponları anında e-postanıza gelsin.
          </p>
        </div>

        <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3">
          <input
            type="email"
            placeholder="E-posta adresinizi giriniz..."
            className="w-full sm:w-80 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
          <button className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-95 shrink-0">
            Abone Ol
          </button>
        </div>
      </section>

    </div>
  );
};
