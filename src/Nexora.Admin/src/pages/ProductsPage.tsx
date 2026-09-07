import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { AxiosError } from 'axios';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import type { ApiResponse, PagedResponse } from '../lib/apiClient';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';

interface ProductListItemDto {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  categoryId: string;
  categoryName: string;
  brandId: string;
  brandName: string;
  mainImageUrl?: string;
  isActive: boolean;
}

interface ProductDetailDto {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: string;
  categoryName: string;
  brandId: string;
  brandName: string;
  isActive: boolean;
  images: { id: string; imageUrl: string; isMain: boolean }[];
}

interface CategoryDto {
  id: string;
  name: string;
}

interface BrandDto {
  id: string;
  name: string;
}

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const { data: productsData, isLoading } = useQuery<ApiResponse<PagedResponse<ProductListItemDto>>>({
    queryKey: ['admin-products', page, searchTerm, selectedCategory, selectedBrand, statusFilter],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PagedResponse<ProductListItemDto>>>('/products', {
        params: {
          page,
          pageSize: 15,
          searchTerm: searchTerm || undefined,
          categoryId: selectedCategory || undefined,
          brandId: selectedBrand || undefined,
          isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        }
      });
      return res.data;
    }
  });

  const { data: categoriesData } = useQuery<ApiResponse<CategoryDto[]>>({
    queryKey: ['admin-categories-dropdown'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<CategoryDto[]>>('/categories');
      return res.data;
    }
  });

  const { data: brandsData } = useQuery<ApiResponse<BrandDto[]>>({
    queryKey: ['admin-brands-dropdown'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<BrandDto[]>>('/brands');
      return res.data;
    }
  });

  const categories = categoriesData?.data || [];
  const brands = brandsData?.data || [];
  const products = productsData?.data?.items || [];
  const totalCount = productsData?.data?.totalCount || 0;
  const totalPages = productsData?.data?.totalPages || 1;

  const saveMutation = useMutation({
    mutationFn: async () => {
      setFormError(null);
      if (editingProductId) {
        const res = await apiClient.put(`/products/${editingProductId}`, {
          name,
          sku,
          description,
          price: parseFloat(price),
          stockQuantity: parseInt(stockQuantity, 10),
          categoryId,
          brandId,
          isActive,
        });
        return res.data;
      } else {
        const res = await apiClient.post('/products', {
          name,
          sku,
          description,
          price: parseFloat(price),
          stockQuantity: parseInt(stockQuantity, 10),
          categoryId,
          brandId,
          imageUrls: imageUrl ? [imageUrl] : []
        });
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-products'] });
      closeModal();
    },
    onError: (err: unknown) => {
      const error = err as AxiosError<{ message?: string }>;
      setFormError(error.response?.data?.message || 'Ürün kaydedilirken bir hata oluştu.');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ product, newStatus }: { product: ProductListItemDto; newStatus: boolean }) => {
      setTogglingProductId(product.id);
      
      const detailRes = await apiClient.get<ApiResponse<ProductDetailDto>>(`/products/${product.id}`);
      const p = detailRes.data?.data;

      const res = await apiClient.put(`/products/${product.id}`, {
        name: p?.name || product.name,
        sku: p?.sku || product.sku,
        description: p?.description || '',
        price: p?.price ?? product.price,
        stockQuantity: p?.stockQuantity ?? product.stockQuantity,
        categoryId: p?.categoryId || product.categoryId,
        brandId: p?.brandId || product.brandId,
        isActive: newStatus
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-products'] });
      setTogglingProductId(null);
    },
    onError: (err: unknown) => {
      const error = err as AxiosError<{ message?: string }>;
      alert(error.response?.data?.message || 'Ürün durumu güncellenirken bir hata oluştu.');
      setTogglingProductId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/products/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-products'] });
      setProductToDelete(null);
    },
    onError: (err: unknown) => {
      const error = err as AxiosError<{ message?: string }>;
      alert(error.response?.data?.message || 'Ürün silinirken bir hata oluştu.');
      setProductToDelete(null);
    }
  });

  const openCreateModal = () => {
    setEditingProductId(null);
    setName('');
    setSku(`NX-${Math.floor(1000 + Math.random() * 9000)}`);
    setDescription('');
    setPrice('');
    setStockQuantity('');
    setCategoryId(categories[0]?.id || '');
    setBrandId(brands[0]?.id || '');
    setImageUrl('');
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = async (item: ProductListItemDto) => {
    setEditingProductId(item.id);
    setIsDetailLoading(true);
    setFormError(null);
    setIsModalOpen(true);

    try {
      const res = await apiClient.get<ApiResponse<ProductDetailDto>>(`/products/${item.id}`);
      if (res.data?.isSuccess && res.data.data) {
        const p = res.data.data;
        setName(p.name);
        setSku(p.sku);
        setDescription(p.description || '');
        setPrice(p.price.toString());
        setStockQuantity(p.stockQuantity.toString());
        setCategoryId(p.categoryId || '');
        setBrandId(p.brandId || '');
        setIsActive(p.isActive);
        setImageUrl(p.images?.find(i => i.isMain)?.imageUrl || p.images?.[0]?.imageUrl || '');
      }
    } catch (error) {
      setFormError('Ürün detayları yüklenirken bir sorun oluştu.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProductId(null);
    setFormError(null);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ürün & Stok Yönetimi</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Platformdaki tüm ürünlerin listesi, stok durumları ve katalog güncellemeleri
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Ürün Ekle</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Ürün adı veya SKU ile ara..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-orange-500 focus:bg-white transition-all w-full md:w-44 cursor-pointer"
          >
            <option value="all">Tüm Durumlar (Tümü)</option>
            <option value="active">Sadece Aktifler</option>
            <option value="inactive">Sadece Pasifler</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-orange-500 focus:bg-white transition-all w-full md:w-40"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedBrand}
            onChange={(e) => {
              setSelectedBrand(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-orange-500 focus:bg-white transition-all w-full md:w-36"
          >
            <option value="">Tüm Markalar</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Ürün Bilgisi</th>
                <th className="py-3 px-4">Kategori & Marka</th>
                <th className="py-3 px-4">Birim Fiyat</th>
                <th className="py-3 px-4">Stok</th>
                <th className="py-3 px-4 text-center">Durum</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    Ürünler yükleniyor...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    Kriterlere uygun ürün bulunamadı.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center shrink-0">
                          <img
                            src={product.mainImageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'}
                            alt={product.name}
                            className="max-h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-slate-900 block truncate max-w-xs">{product.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{product.sku}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-700 block">{product.categoryName}</span>
                      <span className="text-[10px] text-slate-400">{product.brandName}</span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold inline-block ${
                        product.stockQuantity <= 25 
                          ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {product.stockQuantity} Adet
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <ToggleSwitch
                        checked={product.isActive}
                        isLoading={togglingProductId === product.id}
                        onChange={(newVal) => toggleStatusMutation.mutate({ product, newStatus: newVal })}
                      />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                          title="Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setProductToDelete({ id: product.id, name: product.name })}
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

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Toplam {totalCount} üründen {(page - 1) * 15 + 1} - {Math.min(page * 15, totalCount)} arası gösteriliyor</span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Önceki
              </button>
              <span className="px-2 font-bold text-slate-800">{page} / {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Sonraki
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingProductId ? 'Ürünü Düzenle' : 'Yeni Ürün Oluştur'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">Katalog ve stok detaylarını doldurun</p>
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

            {isDetailLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium">
                Ürün detayları yükleniyor...
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveMutation.mutate();
                }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Ürün Adı</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Örn: Kablosuz Bluetooth Kulaklık"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">SKU (Stok Kodu)</label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="NX-001"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Stok Miktarı</label>
                    <input
                      type="number"
                      min="0"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      placeholder="100"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Fiyat (TL)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="1299.90"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                    />
                  </div>

                  <SearchableSelect
                    label="Kategori"
                    options={categories}
                    value={categoryId}
                    onChange={(val) => setCategoryId(val)}
                    placeholder="Kategori seçin..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <SearchableSelect
                    label="Marka"
                    options={brands}
                    value={brandId}
                    onChange={(val) => setBrandId(val)}
                    placeholder="Marka seçin..."
                  />

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Görsel URL</label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Ürün Açıklaması</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ürünün öne çıkan özellikleri..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>

                {editingProductId && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block">Satış Durumu</label>
                      <span className="text-[11px] text-slate-400">Pasif ürünler mağazada listelenmez ve satın alınamaz</span>
                    </div>
                    <ToggleSwitch
                      checked={isActive}
                      onChange={(val) => setIsActive(val)}
                    />
                  </div>
                )}

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
                    {saveMutation.isPending ? 'Kaydediliyor...' : editingProductId ? 'Güncelle' : 'Ürünü Oluştur'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={productToDelete !== null}
        title="Ürünü Silmek İstediğinize Emin Misiniz?"
        message="Bu ürünü sildiğinizde, ürün katalogdan ve müşteri sepetlerinden kaldırılacaktır."
        itemName={productToDelete?.name}
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (productToDelete) {
            deleteMutation.mutate(productToDelete.id);
          }
        }}
        onClose={() => setProductToDelete(null)}
      />

    </div>
  );
};
