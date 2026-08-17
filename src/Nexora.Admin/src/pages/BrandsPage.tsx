import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Plus, Search, Edit2, Trash2, CheckCircle2, X, AlertCircle, RefreshCw } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import type { ApiResponse } from '../lib/apiClient';

interface BrandDto {
  id: string;
  name: string;
  logoUrl?: string;
  isActive: boolean;
}

export const BrandsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandDto | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State'leri
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // 1. Markaları Çek (Redis destekli)
  const { data: brandsData, isLoading, refetch } = useQuery<ApiResponse<BrandDto[]>>({
    queryKey: ['admin-brands-list'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<BrandDto[]>>('/brands');
      return res.data;
    }
  });

  const brands = brandsData?.data || [];
  const filteredBrands = brands.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ekleme / Güncelleme Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      setFormError(null);
      if (editingBrand) {
        const res = await apiClient.put(`/brands/${editingBrand.id}`, {
          name,
          logoUrl: logoUrl || undefined,
        });
        return res.data;
      } else {
        const res = await apiClient.post('/brands', {
          name,
          logoUrl: logoUrl || undefined,
        });
        return res.data;
      }
    },
    onSuccess: () => {
      // Redis Cache Invalidation backend'de otomatik çalışır, frontend önbelleğini tazeliyoruz
      queryClient.invalidateQueries({ queryKey: ['admin-brands-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-brands-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-brands'] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Marka kaydedilirken bir hata oluştu.');
    }
  });

  // Silme Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/brands/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-brands-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-brands'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Marka silinirken bir hata oluştu.');
    }
  });

  const openCreateModal = () => {
    setEditingBrand(null);
    setName('');
    setLogoUrl('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (brand: BrandDto) => {
    setEditingBrand(brand);
    setName(brand.name);
    setLogoUrl(brand.logoUrl || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBrand(null);
    setFormError(null);
  };

  const handleDelete = (id: string, brandName: string) => {
    if (window.confirm(`"${brandName}" markasını silmek istediğinize emin misiniz?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">

      {/* Üst Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Marka Yönetimi</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Platformdaki anlaşmalı markaları ve logolarını yönetin
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Markaları Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Marka Ekle</span>
          </button>
        </div>
      </div>

      {/* Arama Çubuğu */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Marka adı ile ara..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Markalar Tablosu */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Marka & Logo</th>
                <th className="py-3 px-4">Logo URL</th>
                <th className="py-3 px-4 text-center">Durum</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                    Markalar yükleniyor...
                  </td>
                </tr>
              ) : filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                    Marka bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredBrands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center shrink-0">
                          {brand.logoUrl ? (
                            <img
                              src={brand.logoUrl}
                              alt={brand.name}
                              className="max-h-full object-contain"
                            />
                          ) : (
                            <Tag className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <span className="font-bold text-slate-900">{brand.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-500 max-w-md truncate">
                      {brand.logoUrl || '-'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(brand)}
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                          title="Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id, brand.name)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingBrand ? 'Markayı Düzenle' : 'Yeni Marka Oluştur'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">Marka detaylarını girin</p>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Marka Adı</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Samsung"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Logo Görsel URL (Opsiyonel)</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saveMutation.isPending ? 'Kaydediliyor...' : editingBrand ? 'Güncelle' : 'Markayı Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};


