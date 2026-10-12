import React, { useState } from 'react';
import { MapPin, Plus, Star, Trash2, X } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { SearchableSelect } from '../ui/SearchableSelect';
import { TURKEY_CITIES } from '../../data/turkeyLocations';
import type { AddressDto } from '../../types/address';

interface AddressBookTabProps {
  addresses: AddressDto[];
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => Promise<void> | void;
  onCreateAddress: (addressData: {
    title: string;
    fullName: string;
    phoneNumber: string;
    city: string;
    district: string;
    detailedAddress: string;
    postalCode?: string;
    isDefault: boolean;
  }) => Promise<boolean>;
  onDeleteAddress: (addressId: string) => Promise<void>;
  onSetDefaultAddress: (addressId: string) => Promise<void>;
  defaultFullName: string;
}

export const AddressBookTab: React.FC<AddressBookTabProps> = ({
  addresses,
  isLoading,
  isError,
  onRefresh,
  onCreateAddress,
  onDeleteAddress,
  onSetDefaultAddress,
  defaultFullName,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    fullName: defaultFullName,
    phoneNumber: '',
    city: '',
    district: '',
    detailedAddress: '',
    postalCode: '',
    isDefault: false,
  });

  const selectedCityData = TURKEY_CITIES.find((c) => c.name === form.city);
  const allCityNames = TURKEY_CITIES.map((c) => c.name);
  const availableDistricts = selectedCityData?.districts || [];

  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    setForm((prev) => ({ ...prev, phoneNumber: raw }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!form.title || !form.fullName || !form.phoneNumber || !form.city || !form.district || !form.detailedAddress) {
      setErrorMessage('Lütfen zorunlu alanları eksiksiz doldurun.');
      return;
    }

    setIsSaving(true);
    try {
      const success = await onCreateAddress(form);
      if (success) {
        setIsModalOpen(false);
        setForm({
          title: '',
          fullName: defaultFullName,
          phoneNumber: '',
          city: '',
          district: '',
          detailedAddress: '',
          postalCode: '',
          isDefault: false,
        });
      }
    } catch {
      setErrorMessage('Adres kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in-50">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Kayıtlı Adreslerim</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Siparişlerinizde hızlı teslimat için kayıtlı adreslerinizi yönetin
          </p>
        </div>
        <button
          onClick={() => {
            setForm((prev) => ({ ...prev, fullName: defaultFullName }));
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Yeni Adres Ekle</span>
        </button>
      </div>

      {isError ? (
        <p role="alert" className="text-rose-600">
          Adresler yüklenemedi.{' '}
          <button onClick={() => void onRefresh()} className="font-bold underline cursor-pointer">
            Tekrar dene
          </button>
        </p>
      ) : isLoading ? (
        <div className="flex justify-center items-center py-16">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-200/80 text-center space-y-3">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">Henüz kayıtlı bir adresiniz bulunmamaktadır.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 px-5 py-2.5 bg-orange-500 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-orange-600 transition-all cursor-pointer"
          >
            Hemen Adres Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`rounded-3xl p-5 border transition-all relative flex flex-col justify-between space-y-3 ${
                addr.isDefault
                  ? 'border-orange-300 bg-orange-50/20 shadow-xs'
                  : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-orange-500" /> {addr.title}
                  </span>
                  {addr.isDefault && (
                    <span className="text-[10px] bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-orange-500 text-orange-500" /> Varsayılan
                    </span>
                  )}
                </div>

                <div className="text-xs font-semibold text-slate-800">
                  {addr.fullName} • <span className="text-slate-500 font-mono">{addr.phoneNumber}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {addr.detailedAddress}
                </p>

                <div className="text-[11px] font-bold text-slate-500">
                  {addr.district} / {addr.city} {addr.postalCode ? `(${addr.postalCode})` : ''}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                {!addr.isDefault ? (
                  <button
                    onClick={() => onSetDefaultAddress(addr.id)}
                    className="text-slate-500 hover:text-orange-600 font-semibold text-[11px] cursor-pointer"
                  >
                    Varsayılan Yap
                  </button>
                ) : <div />}

                <button
                  onClick={() => onDeleteAddress(addr.id)}
                  className="text-rose-500 hover:text-rose-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Adres Ekleme Modal */}
      {isModalOpen && (
        <Dialog
          label="Yeni Adres Ekle"
          onClose={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" /> Yeni Adres Ekle
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Adres Başlığı *</label>
                  <input
                    type="text"
                    placeholder="Örn: Ev, İş"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Teslim Alacak Kişi *</label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Telefon Numarası *</label>
                  <input
                    type="tel"
                    placeholder="05xxxxxxxxx"
                    value={form.phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-orange-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Posta Kodu</label>
                  <input
                    type="text"
                    placeholder="34000"
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <SearchableSelect
                    label="İl *"
                    placeholder="İl seçin"
                    value={form.city}
                    options={allCityNames}
                    onChange={(val) => setForm({ ...form, city: val, district: '' })}
                  />
                </div>
                <div>
                  <SearchableSelect
                    label="İlçe *"
                    placeholder={form.city ? 'İlçe seçin' : 'Önce il seçin'}
                    value={form.district}
                    options={availableDistricts}
                    disabled={!form.city}
                    onChange={(val) => setForm({ ...form, district: val })}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Açık Adres (Cadde, Sokak, No, Daire) *</label>
                <textarea
                  rows={3}
                  placeholder="Mahalle, sokak, bina ve daire numarası..."
                  value={form.detailedAddress}
                  onChange={(e) => setForm({ ...form, detailedAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-orange-500 resize-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="defaultAddressCheckbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="rounded-sm border-slate-300 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="defaultAddressCheckbox" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Bu adresi varsayılan teslimat adresi olarak ayarla
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Kaydediliyor...' : 'Adresi Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}
    </div>
  );
};
