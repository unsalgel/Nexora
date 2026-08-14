import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Star, 
  Heart, 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  Plus, 
  Minus, 
  ChevronRight,
  Share2,
  Tag,
  MessageSquare
} from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';
import { apiClient } from '../lib/apiClient';
import type { ApiResponse, PagedResponse } from '../lib/apiClient';

interface ProductImageDto {
  id: string;
  imageUrl: string;
  isMain: boolean;
  displayOrder: number;
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
}

interface ReviewDto {
  id: string;
  productId: string;
  userId: string;
  userFullName: string;
  rating: number;
  comment?: string;
  createdAtUtc: string;
}

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { toggleFavorite, isFavorite: checkIsFavorite } = useFavorites();
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);

  const isLoggedIn = !!localStorage.getItem('accessToken');

  const { data: productData, isLoading, error } = useQuery<ApiResponse<ProductDto>>({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ProductDto>>(`/products/${id}`);
      return response.data;
    },
    enabled: !!id
  });

  const { data: reviewsData, refetch: refetchReviews } = useQuery<ApiResponse<PagedResponse<ReviewDto>>>({
    queryKey: ['product-reviews', id],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PagedResponse<ReviewDto>>>(`/reviews/product/${id}`, {
        params: { page: 1, pageSize: 50 }
      });
      return response.data;
    },
    enabled: !!id
  });

  const addReviewMutation = useMutation({
    mutationFn: async (payload: { rating: number; comment: string }) => {
      const response = await apiClient.post<ApiResponse<string>>('/reviews', {
        productId: id,
        rating: payload.rating,
        comment: payload.comment
      });
      return response.data;
    },
    onSuccess: () => {
      setNewComment('');
      setNewRating(5);
      refetchReviews();
      queryClient.invalidateQueries({ queryKey: ['product', id] });
    },
    onError: (err: any) => {
      setReviewError(err.response?.data?.message || 'Yorum eklenirken hata oluştu.');
    }
  });

  const product = productData?.data;
  const reviews = reviewsData?.data?.items || [];
  const isFav = product ? checkIsFavorite(product.id) : false;

  const handleAddToCart = async () => {
    if (product) {
      const success = await addToCart(product.id, quantity);
      if (success) {
        setIsAddedToCart(true);
        setTimeout(() => setIsAddedToCart(false), 2500);
      }
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    addReviewMutation.mutate({ rating: newRating, comment: newComment });
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Ürün bulunamadı veya bir hata oluştu.</h2>
        <Link to="/products" className="inline-block px-4 py-2 bg-orange-500 text-white rounded-xl font-bold text-xs shadow-sm">
          Kataloğa Dön
        </Link>
      </div>
    );
  }

  const discountText = "%25 İndirim";
  const oldPrice = product.price * 1.25;
  const savings = oldPrice - product.price;

  const imageUrls = product.images.length > 0 
    ? product.images.map(img => img.imageUrl) 
    : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'];

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <div className="space-y-8 pb-16">
      
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/" className="hover:text-orange-600 transition-colors">Ana Sayfa</Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link to="/products" className="hover:text-orange-600 transition-colors">{product.categoryName}</Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-800 font-semibold truncate max-w-xs">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* SOL RESİM GALERİSİ */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative h-80 sm:h-[400px] bg-white rounded-3xl border border-slate-200/80 overflow-hidden p-6 flex items-center justify-center shadow-sm group">
            <img
              src={imageUrls[selectedImageIdx]}
              alt={product.name}
              className="max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
            />
            
            <div className="absolute top-4 left-4 bg-orange-500 text-white text-[11px] font-bold tracking-wider px-3 py-1.5 rounded-lg shadow-md shadow-orange-500/25 uppercase">
              {discountText}
            </div>

            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button 
                onClick={() => toggleFavorite({ 
                  id: product.id, 
                  title: product.name, 
                  price: product.price, 
                  oldPrice: oldPrice, 
                  image: imageUrls[0] 
                })}
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

          {imageUrls.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {imageUrls.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-20 h-20 bg-white rounded-2xl border p-2 flex items-center justify-center shrink-0 transition-all ${
                    selectedImageIdx === idx ? 'border-orange-500 ring-2 ring-orange-500/10' : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt="" className="max-h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SAĞ DETAY ALANI */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-orange-50 text-orange-600 border border-orange-100 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider">
                {product.brandName}
              </span>
              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                Stok Durumu: {product.stockQuantity > 0 ? `${product.stockQuantity} Adet` : 'Tükendi'}
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <div className="flex items-center text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    className={`w-4 h-4 ${s <= Math.round(Number(averageRating)) ? 'fill-amber-400' : 'text-slate-200'}`} 
                  />
                ))}
              </div>
              <span className="font-bold text-slate-800">{averageRating}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 font-medium">{reviews.length} Değerlendirme</span>
            </div>
          </div>

          <div className="border-t border-slate-200/80" />

          {/* Fiyat Kartı */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
              </span>
              <span className="text-slate-400 line-through text-xs sm:text-sm font-medium">
                {oldPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
              </span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                Kazancınız: {savings.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
              </span>
            </div>
          </div>

          {/* Adet Seçici ve Butonlar */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="flex items-center border border-slate-200 rounded-2xl bg-white p-1 self-start sm:self-auto shrink-0 shadow-sm">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="p-2 hover:bg-slate-50 text-slate-500 rounded-xl transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-5 text-sm font-bold text-slate-800 min-w-[40px] text-center">
                {quantity}
              </span>
              <button 
                onClick={() => setQuantity(q => q + 1)}
                className="p-2 hover:bg-slate-50 text-slate-500 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stockQuantity === 0}
                className={`flex-1 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
                  isAddedToCart 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10'
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isAddedToCart ? 'Sepete Eklendi!' : 'Sepete Ekle'}</span>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-200/80" />

          {/* Detay Bilgileri */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <Truck className="w-5 h-5 text-orange-500 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Hızlı Teslimat</span>
                <span className="text-slate-400 font-medium">Yarın kapında</span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Orijinal Ürün</span>
                <span className="text-slate-400 font-medium">%100 Orijinal Garantisi</span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <RotateCcw className="w-5 h-5 text-blue-500 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Kolay İade</span>
                <span className="text-slate-400 font-medium">14 gün içinde ücretsiz</span>
              </div>
            </div>
          </div>

          {/* Sekmeli Açıklama Paneli */}
          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="flex border-b border-slate-200 bg-slate-50/50">
              <button
                onClick={() => setActiveTab('desc')}
                className={`flex-1 py-3.5 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'desc' ? 'border-orange-500 text-orange-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Ürün Açıklaması
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`flex-1 py-3.5 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'specs' ? 'border-orange-500 text-orange-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Teknik Özellikler
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 py-3.5 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'reviews' ? 'border-orange-500 text-orange-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Değerlendirmeler ({reviews.length})
              </button>
            </div>

            <div className="p-6 text-xs text-slate-600 leading-relaxed font-medium">
              {activeTab === 'desc' && (
                <p>{product.description || 'Açıklama belirtilmemiş.'}</p>
              )}
              {activeTab === 'specs' && (
                <div className="space-y-2">
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-slate-400 font-bold">Marka</span>
                    <span className="text-slate-800 font-bold">{product.brandName}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-slate-400 font-bold">Kategori</span>
                    <span className="text-slate-800 font-bold">{product.categoryName}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-slate-400 font-bold">Model Kodu</span>
                    <span className="text-slate-800 font-bold">{product.sku}</span>
                  </div>
                </div>
              )}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Yorum Ekleme Formu */}
                  {isLoggedIn ? (
                    <form onSubmit={handleReviewSubmit} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                      <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                        <MessageSquare className="w-4 h-4 text-orange-500" />
                        Ürünü Değerlendir
                      </h3>
                      
                      {reviewError && (
                        <div className="p-2.5 bg-rose-50 border border-rose-150 text-rose-700 rounded-xl text-[10px] font-bold">
                          {reviewError}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-700">Puanınız:</span>
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              type="button"
                              key={s}
                              onClick={() => setNewRating(s)}
                              className="p-0.5 hover:scale-110 transition-transform"
                            >
                              <Star className={`w-5 h-5 ${s <= newRating ? 'fill-amber-400' : 'text-slate-200'}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <textarea
                          required
                          rows={3}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Ürün hakkındaki yorumlarınızı buraya yazın..."
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-orange-500 font-medium"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={addReviewMutation.isPending}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md shadow-orange-500/10 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {addReviewMutation.isPending ? 'Gönderiliyor...' : 'Yorumu Gönder'}
                      </button>
                    </form>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                      <p className="text-[11px] text-slate-500 font-bold mb-2">Yorum yapabilmek için giriş yapmalısınız.</p>
                      <Link to="/login" className="inline-block px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-[11px]">Giriş Yap</Link>
                    </div>
                  )}

                  {/* Yorum Listesi */}
                  <div className="space-y-4">
                    {reviews.length === 0 ? (
                      <p className="text-slate-400 text-center font-bold py-4">Bu ürüne henüz yorum yapılmamış. İlk yorumu sen yap!</p>
                    ) : (
                      reviews.map((r) => {
                        const date = new Date(r.createdAtUtc).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        });

                        return (
                          <div key={r.id} className="border-b pb-4 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-slate-800">{r.userFullName}</span>
                              <span className="text-slate-400 text-[10px]">{date}</span>
                            </div>
                            <div className="flex items-center text-amber-400 mb-2">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star 
                                  key={s} 
                                  className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-amber-400' : 'text-slate-200'}`} 
                                />
                              ))}
                            </div>
                            <p className="text-slate-600 font-semibold">{r.comment}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
