import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Star, 
  Search, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  MessageSquareQuote
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';

interface Review {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  rating: number;
  comment: string | null;
  createdAtUtc: string;
}

interface ReviewsResponse {
  isSuccess: boolean;
  data: {
    items: Review[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  error?: string;
}

export const ReviewsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-reviews', currentPage, searchTerm, selectedRating],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '10',
      });
      if (searchTerm) params.append('search', searchTerm);
      if (selectedRating) params.append('rating', selectedRating.toString());

      const res = await apiClient.get<ReviewsResponse>(`/reviews?${params.toString()}`);
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/reviews/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setDeleteConfirmId(null);
      setActionMessage({ type: 'success', text: 'Yorum başarıyla silindi.' });
      setTimeout(() => setActionMessage(null), 3500);
    },
    onError: () => {
      setActionMessage({ type: 'error', text: 'Yorum silinirken bir hata oluştu.' });
      setTimeout(() => setActionMessage(null), 3500);
    },
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-200'
            }`}
          />
        ))}
      </div>
    );
  };

  const reviews = data?.data?.items || [];
  const totalCount = data?.data?.totalCount || 0;
  const totalPages = data?.data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquareQuote className="w-7 h-7 text-orange-600" />
            Yorum Yönetimi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Müşterilerin ürünlere yaptığı tüm değerlendirme ve yorumları inceleyin veya yönetin.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border animate-in fade-in duration-200 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Ürün adı, müşteri veya yorum metninde ara..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedRating}
            onChange={(e) => {
              setSelectedRating(e.target.value ? Number(e.target.value) : '');
              setCurrentPage(1);
            }}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="">Tüm Puanlar</option>
            <option value="5">5 Yıldız</option>
            <option value="4">4 Yıldız</option>
            <option value="3">3 Yıldız</option>
            <option value="2">2 Yıldız</option>
            <option value="1">1 Yıldız</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Ürün</th>
                <th className="px-6 py-4">Müşteri</th>
                <th className="px-6 py-4">Puan</th>
                <th className="px-6 py-4">Yorum</th>
                <th className="px-6 py-4">Tarih</th>
                <th className="px-6 py-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Yorumlar yükleniyor...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-rose-500">
                    Yorumlar alınırken bir hata oluştu.
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Kriterlere uygun yorum bulunamadı.
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 max-w-xs truncate">
                      {review.productName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{review.userFullName}</div>
                      <div className="text-xs text-slate-400">{review.userEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      {renderStars(review.rating)}
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <p className="text-slate-700 whitespace-pre-line line-clamp-3">
                        {review.comment || <span className="text-slate-400 italic">Yorum metni yok</span>}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(review.createdAtUtc).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setDeleteConfirmId(review.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                        title="Yorumu Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Sil
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Toplam <span className="font-semibold text-slate-700">{totalCount}</span> yorum
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-slate-700 px-2">
              Sayfa {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900">Yorumu Sil</h3>
            <p className="text-sm text-slate-600 mt-2">
              Bu değerlendirmeyi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                {deleteMutation.isPending ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
