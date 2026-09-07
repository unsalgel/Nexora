import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Search, 
  CheckCircle2, 
  Clock, 
  Percent, 
  Coins, 
  X, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import type { ApiResponse } from '../lib/apiClient';
import type { CouponDto, CreateCouponDto } from '../types/coupon';
import { AxiosError } from 'axios';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { ToastContainer } from '../components/ui/Toast';
import type { ToastMessage } from '../components/ui/Toast';

export const CouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [togglingCouponId, setTogglingCouponId] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const [couponToDelete, setCouponToDelete] = useState<{ id: string; code: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [formData, setFormData] = useState<{
    code: string;
    discountType: 'Percentage' | 'FixedAmount';
    discountValue: number;
    minimumOrderAmount: number;
    maximumDiscountAmount: number | '';
    totalUsageLimit: number;
    expirationDate: string;
  }>({
    code: '',
    discountType: 'Percentage',
    discountValue: 10,
    minimumOrderAmount: 200,
    maximumDiscountAmount: 100,
    totalUsageLimit: 100,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<ApiResponse<CouponDto[]>>('/coupons');
      if (response.data?.isSuccess && response.data.data) {
        setCoupons(response.data.data);
      }
    } catch {
      setErrorMessage('Kuponlar yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.code.trim()) {
      setErrorMessage('Kupon kodu boş bırakılamaz.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateCouponDto = {
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType === 'Percentage' ? 1 : 2,
        discountValue: Number(formData.discountValue),
        minimumOrderAmount: Number(formData.minimumOrderAmount),
        maximumDiscountAmount: formData.maximumDiscountAmount !== '' ? Number(formData.maximumDiscountAmount) : null,
        totalUsageLimit: Number(formData.totalUsageLimit),
        expirationDateUtc: new Date(`${formData.expirationDate}T23:59:59Z`).toISOString()
      };

      const response = await apiClient.post<ApiResponse<CouponDto>>('/coupons', payload);

      if (response.data?.isSuccess && response.data.data) {
        setCoupons(prev => [response.data.data, ...prev]);
        setSuccessMessage('Kupon başarıyla oluşturuldu.');
        setIsModalOpen(false);
        setFormData({
          code: '',
          discountType: 'Percentage',
          discountValue: 10,
          minimumOrderAmount: 200,
          maximumDiscountAmount: 100,
          totalUsageLimit: 100,
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ApiResponse<unknown>>;
      const msg = axiosError.response?.data?.message || 'Kupon oluşturulurken bir hata oluştu.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCouponStatus = async (coupon: CouponDto, newStatus: boolean) => {
    try {
      setTogglingCouponId(coupon.id);
      const res = await apiClient.put<ApiResponse<string>>(`/coupons/${coupon.id}/status`, newStatus, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.data?.isSuccess) {
        setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, isActive: newStatus } : c));
        showToast('success', `"${coupon.code}" kuponu başarıyla ${newStatus ? 'aktif' : 'pasif'} duruma getirildi.`);
      }
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ApiResponse<unknown>>;
      showToast('error', axiosError.response?.data?.message || 'Kupon durumu güncellenirken bir hata oluştu.');
    } finally {
      setTogglingCouponId(null);
    }
  };

  const confirmDeleteCoupon = async () => {
    if (!couponToDelete) return;

    try {
      setIsDeleting(true);
      const response = await apiClient.delete<ApiResponse<string>>(`/coupons/${couponToDelete.id}`);
      if (response.data?.isSuccess) {
        setCoupons(prev => prev.filter(c => c.id !== couponToDelete.id));
        showToast('success', `'${couponToDelete.code}' kuponu başarıyla silindi.`);
        setCouponToDelete(null);
      }
    } catch {
      showToast('error', 'Kupon silinirken bir hata oluştu.');
      setCouponToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCoupons = coupons.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'active') return c.isActive;
    if (statusFilter === 'inactive') return !c.isActive;
    return true;
  });

  const activeCouponsCount = coupons.filter(c => c.isActive && new Date(c.expirationDateUtc) > new Date()).length;
  const totalUsages = coupons.reduce((sum, c) => sum + c.currentUsageCount, 0);

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Ticket className="w-7 h-7 text-orange-500" />
            <span>Kupon Yönetimi</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Müşterileriniz için indirim kuponları ve promosyon kodları oluşturun.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMessage(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 transition-transform active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Kupon Oluştur</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Toplam Kupon</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{coupons.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
            <Ticket className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Aktif Kuponlar</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{activeCouponsCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Toplam Kullanım</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-slate-900">{totalUsages}</span>
              <span className="text-xs font-bold text-slate-400">Kez</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Kupon kodu ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all uppercase"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-orange-500 focus:bg-white transition-all w-full sm:w-44 cursor-pointer"
            >
              <option value="all">Tüm Kuponlar</option>
              <option value="active">Sadece Aktifler</option>
              <option value="inactive">Sadece Pasifler</option>
            </select>
          </div>

          <span className="text-xs font-bold text-slate-400 shrink-0">
            {filteredCoupons.length} Kupon
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Kupon Kodu</th>
                <th className="py-3.5 px-4">İndirim Türü & Tutarı</th>
                <th className="py-3.5 px-4">Min. Sepet Tutarı</th>
                <th className="py-3.5 px-4">Kullanım Durumu</th>
                <th className="py-3.5 px-4">Son Kullanma</th>
                <th className="py-3.5 px-4 text-center">Durum</th>
                <th className="py-3.5 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
                    Kuponlar yükleniyor...
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Kupon bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => {
                  const isExpired = new Date(coupon.expirationDateUtc) < new Date();
                  const isFull = coupon.currentUsageCount >= coupon.totalUsageLimit;
                  const isPercentage = coupon.discountType.toLowerCase() === 'percentage';

                  return (
                    <tr key={coupon.id} className="hover:bg-slate-50/60 transition-colors">
                      
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 font-mono font-bold text-xs border border-orange-200/60 inline-block">
                          {coupon.code}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          {isPercentage ? (
                            <>
                              <Percent className="w-3.5 h-3.5 text-blue-500" />
                              <span>%{coupon.discountValue} İndirim</span>
                              {coupon.maximumDiscountAmount && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  (Maks {coupon.maximumDiscountAmount} TL)
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <Coins className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{coupon.discountValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL İndirim</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-600">
                        {coupon.minimumOrderAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1 max-w-[120px]">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span>{coupon.currentUsageCount}</span>
                            <span>{coupon.totalUsageLimit}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${isFull ? 'bg-rose-500' : 'bg-orange-500'}`}
                              style={{ width: `${Math.min(100, (coupon.currentUsageCount / coupon.totalUsageLimit) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(coupon.expirationDateUtc).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <ToggleSwitch
                            checked={coupon.isActive}
                            isLoading={togglingCouponId === coupon.id}
                            onChange={(newVal) => handleToggleCouponStatus(coupon, newVal)}
                          />
                          {isExpired && (
                            <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded text-[9px] font-bold">
                              Süresi Doldu
                            </span>
                          )}
                          {!isExpired && isFull && (
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded text-[9px] font-bold">
                              Doldu
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setCouponToDelete({ id: coupon.id, code: coupon.code })}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Kuponu Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-orange-500" />
                <span>Yeni Kupon Oluştur</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Kupon Kodu *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: YAZ2026, SUPER50"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">İndirim Türü *</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'Percentage' | 'FixedAmount' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  >
                    <option value="Percentage">Yüzdelik İndirim (%)</option>
                    <option value="FixedAmount">Sabit Tutar İndirimi (TL)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {formData.discountType === 'Percentage' ? 'İndirim Oranı (%) *' : 'İndirim Tutarı (TL) *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Min. Sepet Tutarı (TL) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formData.minimumOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minimumOrderAmount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Maks. İndirim (TL) (Opsiyonel)</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    disabled={formData.discountType === 'FixedAmount'}
                    placeholder={formData.discountType === 'FixedAmount' ? 'Sabit tutarda geçersiz' : 'Örn: 250'}
                    value={formData.maximumDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maximumDiscountAmount: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kullanım Limiti (Adet) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.totalUsageLimit}
                    onChange={(e) => setFormData({ ...formData, totalUsageLimit: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Son Kullanma Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Kuponu Kaydet</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={couponToDelete !== null}
        title="Kuponu Silmek İstediğinize Emin Misiniz?"
        message="Bu kupon kodunu sildiğinizde, müşteriler bu kuponla artık indirim kazanamayacaktır."
        itemName={couponToDelete?.code}
        isLoading={isDeleting}
        onConfirm={confirmDeleteCoupon}
        onClose={() => setCouponToDelete(null)}
      />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />

    </div>
  );
};
