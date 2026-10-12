import React from 'react';
import { MapPin, Plus, Check, ArrowRight } from 'lucide-react';
import { SearchableSelect } from '../ui/SearchableSelect';
import { TURKEY_CITIES } from '../../data/turkeyLocations';
import type { AddressDto } from '../../types/address';

interface ShippingAddressSectionProps {
  savedAddresses: AddressDto[];
  selectedAddressId: string | 'custom';
  onSelectAddress: (addr: AddressDto) => void;
  isNewAddressFormOpen: boolean;
  onToggleNewAddressForm: () => void;
  address: {
    fullName: string;
    phone: string;
    city: string;
    district: string;
    fullAddress: string;
  };
  onAddressChange: (fields: Partial<{
    fullName: string;
    phone: string;
    city: string;
    district: string;
    fullAddress: string;
  }>) => void;
  addressTitle: string;
  onAddressTitleChange: (val: string) => void;
  shouldSaveAddress: boolean;
  onToggleShouldSaveAddress: () => void;
  onNextStep: (e: React.FormEvent) => void;
  onPhoneChange: (val: string) => void;
}

export const ShippingAddressSection: React.FC<ShippingAddressSectionProps> = ({
  savedAddresses,
  selectedAddressId,
  onSelectAddress,
  isNewAddressFormOpen,
  onToggleNewAddressForm,
  address,
  onAddressChange,
  addressTitle,
  onAddressTitleChange,
  shouldSaveAddress,
  onToggleShouldSaveAddress,
  onNextStep,
  onPhoneChange,
}) => {
  const selectedCityData = TURKEY_CITIES.find((c) => c.name === address.city);
  const allCityNames = TURKEY_CITIES.map((c) => c.name);
  const availableDistricts = selectedCityData?.districts || [];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-orange-500" />
          <span>Teslimat Adresi Seçimi</span>
        </h2>
        {savedAddresses.length > 0 && (
          <button
            type="button"
            onClick={onToggleNewAddressForm}
            className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isNewAddressFormOpen ? 'Kayıtlı Adreslerime Dön' : 'Yeni Adres Gir'}</span>
          </button>
        )}
      </div>

      {/* Kayıtlı Adres Seçim Kartları */}
      {savedAddresses.length > 0 && !isNewAddressFormOpen && (
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-700 block">Kayıtlı Adreslerinizden Seçin:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {savedAddresses.map((addr) => {
              const isSelected = selectedAddressId === addr.id;
              return (
                <div
                  key={addr.id}
                  onClick={() => onSelectAddress(addr)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/20 shadow-xs ring-2 ring-orange-500/10'
                      : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-orange-600' : 'text-slate-400'}`} />
                      {addr.title}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px]">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-semibold text-slate-800">
                    {addr.fullName} • <span className="text-slate-500 font-mono text-[11px]">{addr.phoneNumber}</span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {addr.detailedAddress}
                  </p>

                  <div className="text-[11px] font-bold text-slate-400">
                    {addr.district} / {addr.city}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Yeni / Manuel Adres Girişi */}
      {(isNewAddressFormOpen || savedAddresses.length === 0) && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="checkout-address-title" className="text-xs font-bold text-slate-700 block mb-1.5">
                Adres Başlığı (Örn: Evim, İşyeri, Yazlık)
              </label>
              <input
                id="checkout-address-title"
                type="text"
                maxLength={50}
                placeholder="Örn: Evim"
                value={addressTitle}
                onChange={(e) => onAddressTitleChange(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label htmlFor="checkout-address-fullname" className="text-xs font-bold text-slate-700 block mb-1.5">
                Ad Soyad *
              </label>
              <input
                id="checkout-address-fullname"
                type="text"
                required
                maxLength={100}
                placeholder="Örn: Ahmet Yılmaz"
                value={address.fullName}
                onChange={(e) => onAddressChange({ fullName: e.target.value })}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label htmlFor="checkout-address-phone" className="text-xs font-bold text-slate-700 block mb-1.5">
                Telefon Numarası *
              </label>
              <input
                id="checkout-address-phone"
                type="tel"
                required
                maxLength={11}
                placeholder="05XXXXXXXXX"
                value={address.phone}
                onChange={(e) => onPhoneChange(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <SearchableSelect
                label="İl *"
                required
                placeholder="İl Seçiniz..."
                options={allCityNames}
                value={address.city}
                onChange={(val) => onAddressChange({ city: val, district: '' })}
              />
            </div>

            <div>
              <SearchableSelect
                label="İlçe *"
                required
                disabled={!address.city}
                placeholder="İlçe Seçiniz..."
                options={availableDistricts}
                value={address.district}
                onChange={(val) => onAddressChange({ district: val })}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="checkout-address-detail" className="text-xs font-bold text-slate-700 block mb-1.5">
                Açık Adres (Cadde, Mahalle, Sokak, No, Daire) *
              </label>
              <textarea
                id="checkout-address-detail"
                rows={3}
                required
                maxLength={500}
                placeholder="Kargo görevlisinin paketi kolayca ulaştırabilmesi için detaylı adresinizi giriniz..."
                value={address.fullAddress}
                onChange={(e) => onAddressChange({ fullAddress: e.target.value })}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all leading-relaxed"
              />
            </div>

            <div className="sm:col-span-2 pt-1">
              <div
                onClick={onToggleShouldSaveAddress}
                className="group flex items-center gap-3 p-3 rounded-2xl bg-slate-50/70 hover:bg-orange-50/40 border border-slate-200/80 hover:border-orange-200 transition-all cursor-pointer select-none"
              >
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    shouldSaveAddress
                      ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/30 ring-2 ring-orange-500/20'
                      : 'bg-white border-2 border-slate-300 group-hover:border-orange-400'
                  }`}
                >
                  {shouldSaveAddress && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-orange-950 transition-colors">
                    Bu adresi sonraki siparişlerim için kayıtlı adreslerime ekle
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    Gelecek siparişlerinizde adres bilgilerini tekrar yazmadan tek tıkla seçebilirsiniz
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onNextStep}
        className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
      >
        <span>Ödeme Adımına Geç</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
