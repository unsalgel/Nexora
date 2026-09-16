import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings, 
  Store, 
  Mail, 
  Phone, 
  Truck, 
  Megaphone, 
  CheckCircle2, 
  AlertCircle,
  Save,
  Loader2
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';

interface SiteSettings {
  siteTitle: string;
  contactEmail: string;
  contactPhone: string;
  freeShippingThreshold: number;
  shippingCost: number;
  announcementText: string;
  isAnnouncementActive: boolean;
}

interface SettingsResponse {
  isSuccess: boolean;
  data: SiteSettings;
  message?: string;
}

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<SiteSettings>({
    siteTitle: '',
    contactEmail: '',
    contactPhone: '',
    freeShippingThreshold: 150,
    shippingCost: 29.90,
    announcementText: '',
    isAnnouncementActive: true
  });

  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-site-settings'],
    queryFn: async () => {
      const res = await apiClient.get<SettingsResponse>('/settings');
      return res.data;
    }
  });

  useEffect(() => {
    if (data?.data) {
      setFormData(data.data);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: SiteSettings) => {
      const res = await apiClient.put<SettingsResponse>('/settings', payload);
      return res.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-site-settings'] });
      if (res.data) setFormData(res.data);
      setActionMessage({ type: 'success', text: 'Site ayarları başarıyla güncellendi.' });
      setTimeout(() => setActionMessage(null), 3500);
    },
    onError: () => {
      setActionMessage({ type: 'error', text: 'Ayarlar güncellenirken bir hata oluştu.' });
      setTimeout(() => setActionMessage(null), 3500);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...formData,
      isAnnouncementActive: Boolean(formData.isAnnouncementActive),
      freeShippingThreshold: Number(formData.freeShippingThreshold),
      shippingCost: Number(formData.shippingCost)
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-orange-600" />
            Site Ayarları
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Platform genel başlık, iletişim, kargo ve üst bildirim bandı ayarlarını yapılandırın.
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

      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          <span className="text-xs font-medium">Ayarlar yükleniyor...</span>
        </div>
      ) : isError ? (
        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 text-rose-700 text-sm">
          Ayarlar alınırken bir hata oluştu.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Store className="w-5 h-5 text-orange-600" />
              Genel Platform Bilgileri
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Site Başlığı</label>
                <input
                  type="text"
                  required
                  value={formData.siteTitle}
                  onChange={(e) => setFormData({ ...formData, siteTitle: e.target.value })}
                  placeholder="Örn: Nexora - Alışverişin Yeni Adresi"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Destek E-postası
                </label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="destek@nexora.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  İletişim Telefonu
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="0850 123 45 67"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Truck className="w-5 h-5 text-orange-600" />
              Kargo & Sipariş Limitleri
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Ücretsiz Kargo Alt Limiti (TL)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={formData.freeShippingThreshold}
                  onChange={(e) => setFormData({ ...formData, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Sabit Kargo Ücreti (TL)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={formData.shippingCost}
                  onChange={(e) => setFormData({ ...formData, shippingCost: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-orange-600" />
                Üst Bildirim / Kampanya Bandı
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Bant Durumu:</span>
                <ToggleSwitch
                  checked={formData.isAnnouncementActive}
                  onChange={(val) => setFormData({ ...formData, isAnnouncementActive: val })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Duyuru Metni</label>
              <input
                type="text"
                required
                value={formData.announcementText}
                onChange={(e) => setFormData({ ...formData, announcementText: e.target.value })}
                placeholder="Örn: 150 TL ve Üzeri Alışverişlerde Kargo Ücretsiz!"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Ayarları Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
