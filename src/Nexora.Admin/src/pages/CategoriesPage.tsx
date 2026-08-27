import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Plus, Search, Edit2, Trash2, X, AlertCircle, RefreshCw } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { AxiosError } from 'axios';
import type { ApiResponse } from '../lib/apiClient';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';

interface CategoryDto {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);
  const [togglingCategoryId, setTogglingCategoryId] = useState<string | null>(null);

  const { data: categoriesData, isLoading, refetch } = useQuery<ApiResponse<CategoryDto[]>>({
    queryKey: ['admin-categories-list'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<CategoryDto[]>>('/categories');
      return res.data;
    }
  });

  const categories = categoriesData?.data || [];
  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      setFormError(null);
      if (editingCategory) {
        const res = await apiClient.put(`/categories/${editingCategory.id}`, {
          name,
          description: description || undefined,
          isActive,
        });
        return res.data;
      } else {
        const res = await apiClient.post('/categories', {
          name,
          description: description || undefined,
        });
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-categories'] });
      closeModal();
    },
    onError: (err: unknown) => {
      const error = err as AxiosError<{ message?: string }>;
      setFormError(error.response?.data?.message || 'Kategori kaydedilirken bir hata oluştu.');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ category, newStatus }: { category: CategoryDto; newStatus: boolean }) => {
      setTogglingCategoryId(category.id);
      const res = await apiClient.put(`/categories/${category.id}`, {
        name: category.name,
        description: category.description || undefined,
        isActive: newStatus
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-categories'] });
      setTogglingCategoryId(null);
    },
    onError: (err: unknown) => {
      const error = err as AxiosError<{ message?: string }>;
      alert(error.response?.data?.message || 'Kategori durumu güncellenirken bir hata oluştu.');
      setTogglingCategoryId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/categories/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-categories'] });
      setCategoryToDelete(null);
    },
    onError: (err: unknown) => {
      const error = err as AxiosError<{ message?: string }>;
      alert(error.response?.data?.message || 'Kategori silinirken bir hata oluştu.');
      setCategoryToDelete(null);
    }
  });

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryDto) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setIsActive(cat.isActive);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormError(null);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kategori Yönetimi</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Platformdaki ürün kategorilerini ve hiyerarşiyi yönetin
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Kategorileri Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Kategori Ekle</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Kategori adı ile ara..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Kategori Adı</th>
                <th className="py-3 px-4">Açıklama</th>
                <th className="py-3 px-4 text-center">Durum</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                    Kategoriler yükleniyor...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                    Kategori bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <span>{cat.name}</span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-500 max-w-md truncate">
                      {cat.description || '-'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <ToggleSwitch
                        checked={cat.isActive}
                        isLoading={togglingCategoryId === cat.id}
                        onChange={(newVal) => toggleStatusMutation.mutate({ category: cat, newStatus: newVal })}
                      />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                          title="Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCategoryToDelete({ id: cat.id, name: cat.name })}
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingCategory ? 'Kategoriyi Düzenle' : 'Yeni Kategori Oluştur'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">Kategori detaylarını girin</p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kategori Adı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Elektronik, Moda, Ev Yaşam..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Açıklama
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kategori hakkında kısa bilgi..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium resize-none"
                />
              </div>

              {editingCategory && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block">Kategori Durumu</label>
                    <span className="text-[11px] text-slate-400">Pasif kategoriler mağazada gizlenir</span>
                  </div>
                  <ToggleSwitch
                    checked={isActive}
                    onChange={(val) => setIsActive(val)}
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {saveMutation.isPending ? 'Kaydediliyor...' : editingCategory ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={categoryToDelete !== null}
        title="Kategoriyi Silmek İstediğinize Emin Misiniz?"
        message="Bu kategoriyi sildiğinizde, kategori altındaki ürünler ve filtreler etkilenebilir."
        itemName={categoryToDelete?.name}
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (categoryToDelete) {
            deleteMutation.mutate(categoryToDelete.id);
          }
        }}
        onClose={() => setCategoryToDelete(null)}
      />

    </div>
  );
};
