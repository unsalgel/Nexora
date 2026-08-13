import React, { useState } from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { Link, useParams } from 'react-router-dom';
import { 
  Star, 
  Heart, 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  Plus, 
  Minus, 
  Check,
  ChevronRight,

  TrendingUp,
  Share2,
  Tag
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const product = {
    id: id || '1',
    title: 'Nexora Pro Wireless Bluetooth Kulaklık Çevre Gürültü Engelleyici ANC',
    brand: 'Nexora Tech',
    category: 'Elektronik',
    price: 1499.90,
    oldPrice: 1999.00,
    discount: '%25 İndirim',
    savings: 499.10,
    rating: 4.8,
    reviewsCount: 342,
    stock: 14,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80'
    ],
    colors: [
      { name: 'Uzay Siyahı', hex: '#1e293b' },
      { name: 'Gümüş Gri', hex: '#94a3b8' },
      { name: 'Gece Mavisi', hex: '#1e3a8a' }
    ],
    description: 'Nexora Pro Wireless Kulaklık, 40dB gelişmiş aktif gürültü engelleme (ANC) teknolojisi, 30 saat kesintisiz pil ömrü ve kristal netliğinde HD ses sürücüleri ile üst düzey müzik ve çağrı deneyimi sunar.'
  };

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0].name);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const { toggleFavorite, isFavorite: checkIsFavorite } = useFavorites();
  const isFav = checkIsFavorite(product.id);

  const handleAddToCart = () => {
    setIsAddedToCart(true);
    setTimeout(() => setIsAddedToCart(false), 2500);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Üst Yol (Breadcrumb) */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/" className="hover:text-orange-600 transition-colors">Ana Sayfa</Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link to="/products" className="hover:text-orange-600 transition-colors">{product.category}</Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-800 font-semibold truncate max-w-xs">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* SOL RESİM GALERİSİ */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative h-80 sm:h-[400px] bg-white rounded-3xl border border-slate-200/80 overflow-hidden p-6 flex items-center justify-center shadow-sm group">
            <img
              src={product.images[selectedImage]}
              alt={product.title}
              className="max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
            />
            
            {/* Trendyol/Hepsiburada Tarzı Temiz & Şık İndirim Rozeti */}
            <div className="absolute top-4 left-4 bg-orange-500 text-white text-[11px] font-bold tracking-wider px-3 py-1.5 rounded-lg shadow-md shadow-orange-500/25 uppercase">
              {product.discount}
            </div>

            {/* Favori & Paylaş */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button 
                onClick={() => toggleFavorite({ id: product.id, title: product.title, price: product.price, oldPrice: product.oldPrice, image: product.images[0] })}
                className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 shadow-sm border border-slate-200 transition-all active:scale-95"
                title="Favorilere Ekle"
              >
                <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
              <button className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 shadow-sm border border-slate-200 transition-all active:scale-95">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Thumbnail Önizlemeler */}
          <div className="flex gap-3">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`w-16 h-16 rounded-2xl bg-white border p-1.5 flex items-center justify-center overflow-hidden transition-all ${
                  selectedImage === idx
                    ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" className="max-h-full object-contain" />
              </button>
            ))}
          </div>
        </div>

        {/* SAĞ ÜRÜN KART ALANI */}
        <div className="lg:col-span-7 space-y-5">
          
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-600 tracking-wider uppercase bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                {product.brand}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                <TrendingUp className="w-3.5 h-3.5" /> Çok Satan #1
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
              {product.title}
            </h1>
            
            {/* Yıldız ve Değerlendirmeler */}
            <div className="flex items-center gap-3 pt-0.5">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
                <span className="font-semibold text-slate-700 ml-1.5 text-xs">{product.rating}</span>
              </div>
              <span className="text-slate-300">|</span>
              <a href="#reviews" className="text-xs font-medium text-slate-500 hover:text-orange-600 transition-colors">
                {product.reviewsCount} Değerlendirme
              </a>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Stokta Var
              </span>
            </div>
          </div>

          {/* İNCE & ZARİF FİYAT / KAZANÇ KARTI */}
          <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 line-through font-medium">
                  {product.oldPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                </span>
                <span className="text-[10px] font-bold text-orange-600 bg-orange-100/60 px-2 py-0.5 rounded-md">
                  {product.discount}
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-bold text-slate-600 ml-1">TL</span>
              </div>
            </div>

            {/* İnce Şık Kazanç Etiketi (Tag İkonlu) */}
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-2 rounded-xl shrink-0">
              <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] font-semibold text-emerald-700 block leading-tight">Bu Üründe Toplam Kazancınız</span>
                <span className="text-xs font-bold text-emerald-700">{product.savings.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL İndirim</span>
              </div>
            </div>
          </div>

          {/* Renk Seçimi */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Renk: <span className="text-orange-600 font-bold">{selectedColor}</span>
            </label>
            <div className="flex items-center gap-2.5">
              {product.colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.name)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    selectedColor === color.name
                      ? 'bg-white border-orange-500 ring-2 ring-orange-500/15 shadow-sm text-slate-900'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: color.hex }} />
                  <span>{color.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SATIN ALMA BUTONLARI */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              
              {/* Adet Seçici */}
              <div className="flex items-center border border-slate-200/90 rounded-xl bg-white p-0.5">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 font-semibold transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center font-bold text-xs text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sepete Ekle */}
              <button
                onClick={handleAddToCart}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {isAddedToCart ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Sepete Eklendi!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Sepete Ekle</span>
                  </>
                )}
              </button>
            </div>

            {/* Hemen Al */}
            <button className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95">
              Hemen Satın Al
            </button>
          </div>

          {/* Rozetler */}
          <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-200/80 text-[11px] font-semibold text-slate-600">
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
              <Truck className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span>Ücretsiz Kargo</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>2 Yıl Garanti</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
              <RotateCcw className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>14 Gün İade</span>
            </div>
          </div>

        </div>
      </div>

      {/* Alt Sekmeler */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('desc')}
            className={`px-5 py-3.5 transition-all relative ${
              activeTab === 'desc' ? 'text-orange-600 bg-white font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Ürün Açıklaması
            {activeTab === 'desc' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
          </button>

          <button
            onClick={() => setActiveTab('specs')}
            className={`px-5 py-3.5 transition-all relative ${
              activeTab === 'specs' ? 'text-orange-600 bg-white font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Teknik Özellikler
            {activeTab === 'specs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-5 py-3.5 transition-all relative ${
              activeTab === 'reviews' ? 'text-orange-600 bg-white font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Müşteri Yorumları ({product.reviewsCount})
            {activeTab === 'reviews' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
          </button>
        </div>

        <div className="p-6 text-xs text-slate-600 leading-relaxed">
          {activeTab === 'desc' && (
            <div className="space-y-3 animate-in fade-in-50">
              <p>{product.description}</p>
              <h4 className="font-bold text-slate-900 text-sm pt-1">Öne Çıkan Avantajlar:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>40dB Aktif Gürültü Engelleme (ANC) Teknolojisi</li>
                <li>30 Saate Kadar Kesintisiz Oynatma Süresi</li>
                <li>Bluetooth 5.3 ile Düşük Gecikme Süresi</li>
              </ul>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in-50">
              <div className="p-2.5 bg-slate-50 rounded-lg flex justify-between">
                <span className="text-slate-500 font-medium">Bağlantı Tipi</span>
                <span className="font-semibold text-slate-900">Bluetooth 5.3</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg flex justify-between">
                <span className="text-slate-500 font-medium">Gürültü Önleme</span>
                <span className="font-semibold text-slate-900">Aktif ANC (40dB)</span>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4 animate-in fade-in-50">
              <div className="flex items-center gap-3 p-3 bg-orange-50/60 border border-orange-100 rounded-xl">
                <div className="text-2xl font-bold text-slate-900">4.8</div>
                <div>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">342 Değerlendirme Ortalaması</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
