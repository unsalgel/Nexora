import React, { useState } from 'react';
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
  Check
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
    rating: 4.8,
    reviewsCount: 342,
    stock: 14,
    sku: 'NXR-TECH-BLU-001',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80'
    ],
    colors: ['Siyah', 'Gümüş Gri', 'Gece Mavisi'],
    sizes: ['Standart'],
    description: 'Nexora Pro Wireless Kulaklık, 40dB gelişmiş aktif gürültü engelleme (ANC) teknolojisi, 30 saat kesintisiz pil ömrü ve kristal netliğinde HD ses sürücüleri ile üst düzey müzik ve çağrı deneyimi sunar.'
  };

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleAddToCart = () => {
    setIsAddedToCart(true);
    setTimeout(() => setIsAddedToCart(false), 2500);
  };

  return (
    <div className="space-y-10 pb-16">
      
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/" className="hover:text-orange-600 transition-colors">Ana Sayfa</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-orange-600 transition-colors">{product.category}</Link>
        <span>/</span>
        <span className="text-slate-900 font-bold truncate max-w-xs">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        <div className="lg:col-span-5 space-y-4">
          <div className="relative h-80 sm:h-96 bg-white rounded-3xl border border-slate-200/90 overflow-hidden card-shadow p-6 flex items-center justify-center">
            <img
              src={product.images[selectedImage]}
              alt={product.title}
              className="max-h-full object-contain transition-all duration-300"
            />
            <span className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-lg shadow-sm">
              {product.discount}
            </span>
            <button 
              onClick={() => setIsFavorite(!isFavorite)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 shadow-sm border border-slate-100 transition-colors"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>

          <div className="flex gap-3">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`w-20 h-20 rounded-2xl bg-white border p-2 flex items-center justify-center overflow-hidden transition-all ${
                  selectedImage === idx
                    ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <img src={img} alt="" className="max-h-full object-contain" />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          
          <div className="space-y-2">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100">
              {product.brand}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {product.title}
            </h1>
            
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
                <span className="font-bold text-slate-800 ml-1.5 text-xs">{product.rating}</span>
              </div>
              <span className="text-slate-300">|</span>
              <a href="#reviews" className="text-xs font-semibold text-slate-500 hover:text-orange-600 transition-colors">
                {product.reviewsCount} Değerlendirme
              </a>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Stokta Var ({product.stock} adet)
              </span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 line-through block font-medium">
                {product.oldPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-sm font-bold text-slate-700">TL</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-500 block">Kazancınız:</span>
              <span className="text-sm font-extrabold text-emerald-600">
                {(product.oldPrice - product.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 block">
              Renk Seçeneği: <span className="text-orange-600 font-extrabold">{selectedColor}</span>
            </label>
            <div className="flex flex-wrap gap-2.5">
              {product.colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedColor === color
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              
              <div className="flex items-center border border-slate-200 rounded-xl bg-white p-1 shadow-sm">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold text-sm text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {isAddedToCart ? (
                  <>
                    <Check className="w-5 h-5 text-white" />
                    <span>Sepete Eklendi!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>Sepete Ekle</span>
                  </>
                )}
              </button>
            </div>

            <button className="w-full py-3.5 bg-slate-900 hover:bg-black text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95">
              Hemen Satın Al
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700">
              <Truck className="w-4 h-4 text-orange-500 shrink-0" />
              <span>Yarın Kargoda</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>2 Yıl Garanti</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700">
              <RotateCcw className="w-4 h-4 text-blue-500 shrink-0" />
              <span>14 Gün İade</span>
            </div>
          </div>

        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('desc')}
            className={`px-6 py-4 font-bold text-sm transition-all relative ${
              activeTab === 'desc' ? 'text-orange-600 bg-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Ürün Açıklaması
            {activeTab === 'desc' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
          </button>

          <button
            onClick={() => setActiveTab('specs')}
            className={`px-6 py-4 font-bold text-sm transition-all relative ${
              activeTab === 'specs' ? 'text-orange-600 bg-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Teknik Özellikler
            {activeTab === 'specs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-4 font-bold text-sm transition-all relative ${
              activeTab === 'reviews' ? 'text-orange-600 bg-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Müşteri Yorumları ({product.reviewsCount})
            {activeTab === 'reviews' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {activeTab === 'desc' && (
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed animate-in fade-in-50">
              <p>{product.description}</p>
              <h4 className="font-bold text-slate-900 text-base pt-2">Öne Çıkan Avantajlar:</h4>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>40dB Aktif Gürültü Engelleme (ANC) Teknolojisi</li>
                <li>30 Saate Kadar Kesintisiz Oynatma Süresi</li>
                <li>Bluetooth 5.3 ile Düşük Gecikme Süresi</li>
                <li>Hızlı Şarj: 10 Dakika Şarj ile 3 Saat Kullanım</li>
              </ul>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-in fade-in-50">
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                <span className="text-slate-500 font-medium">Bağlantı Tipi</span>
                <span className="font-bold text-slate-900">Bluetooth 5.3</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                <span className="text-slate-500 font-medium">Kulaklık Tipi</span>
                <span className="font-bold text-slate-900">Kulak Üstü (Over-Ear)</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                <span className="text-slate-500 font-medium">Şarj Süresi</span>
                <span className="font-bold text-slate-900">1.5 Saat</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                <span className="text-slate-500 font-medium">Gürültü Önleme</span>
                <span className="font-bold text-slate-900">Aktif ANC (40dB)</span>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-in fade-in-50">
              <div className="flex items-center gap-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                <div className="text-3xl font-black text-slate-900">4.8</div>
                <div>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">342 Değerlendirme Ortalaması</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Mehmet K.</span>
                    <span className="text-[10px] text-slate-400">2 gün önce</span>
                  </div>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600">Ses kalitesi ve dip ses olmaması muazzam. Şarjı günlerce gidiyor, tavsiye ederim.</p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
