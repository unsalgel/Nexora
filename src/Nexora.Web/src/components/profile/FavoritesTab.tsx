import React from 'react';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import { SafeImage } from '../common/SafeImage';
import { Pagination } from '../ui/Pagination';
import type { ProductItem } from '../../context/FavoritesContext';

interface FavoritesTabProps {
  favorites: ProductItem[];
  favoritesCount: number;
  favoritesPage: number;
  favoritesPages: number;
  isLoading: boolean;
  isError: boolean;
  onPageChange: (page: number) => void;
  onRefresh: () => Promise<void> | void;
  onToggleFavorite: (item: ProductItem) => void;
  onAddToCart: (productId: string) => void;
}

export const FavoritesTab: React.FC<FavoritesTabProps> = ({
  favorites,
  favoritesCount,
  favoritesPage,
  favoritesPages,
  isLoading,
  isError,
  onPageChange,
  onRefresh,
  onToggleFavorite,
  onAddToCart,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in-50">
      <h2 className="text-base font-bold text-slate-900">
        Favori Ürünlerim ({favoritesCount})
      </h2>

      {isError ? (
        <p role="alert" className="text-rose-600">
          Favoriler yüklenemedi.{' '}
          <button onClick={() => void onRefresh()} className="font-bold underline cursor-pointer">
            Tekrar dene
          </button>
        </p>
      ) : isLoading ? (
        <div className="flex justify-center items-center py-16">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-3">
          <Heart className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Henüz favorilere ürün eklemediniz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {favorites.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3 flex flex-col justify-between relative"
            >
              <button
                aria-label="Favorilerden Çıkar"
                onClick={() => onToggleFavorite(item)}
                className="absolute top-3 right-3 text-rose-500 hover:text-rose-700 transition-colors p-1 cursor-pointer"
                title="Favorilerden Çıkar"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex gap-3.5">
                <div className="w-16 h-16 rounded-xl bg-slate-50 border p-1 shrink-0 flex items-center justify-center">
                  <SafeImage src={item.image} alt={item.title} className="max-h-full object-contain" />
                </div>
                <div className="min-w-0 flex-1 pr-6">
                  <h3 className="text-xs font-bold text-slate-800 line-clamp-1">{item.title}</h3>
                  <div className="mt-1">
                    <span className="text-xs font-extrabold text-orange-600">
                      {item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onAddToCart(item.id)}
                className="w-full py-2 bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Sepete Ekle</span>
              </button>
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={favoritesPage}
        totalPages={favoritesPages}
        onPageChange={onPageChange}
        isLoading={isLoading}
      />
    </div>
  );
};
