import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { apiClient } from '../lib/apiClient';
import { AxiosError } from 'axios';
import type { ApiResponse } from '../lib/apiClient';
import type { CouponValidationResultDto } from '../types/coupon';
import { TURKEY_CITIES } from '../data/turkeyLocations';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { validateLuhn, getCardBrand } from '../lib/cardValidation';
import { CreditCard, MapPin, CheckCircle2, ArrowRight, Lock, AlertCircle, Tag, Plus, Check } from 'lucide-react';
import type { AddressDto } from '../types/address';
import { resolveImageUrl } from '../lib/imageUtils';

interface OrderDto {
  id: string;
  orderNumber: string;
}

export const CheckoutPage: React.FC = () => {
  const { cart, clearCart, refreshCart } = useCart();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResultDto | null>(null);

  // Kayıtlı Adresler
  const [savedAddresses, setSavedAddresses] = useState<AddressDto[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'custom'>('custom');
  const [isNewAddressFormOpen, setIsNewAddressFormOpen] = useState(false);

  useEffect(() => {
    try {
      const savedCoupon = sessionStorage.getItem('appliedCoupon');
      if (savedCoupon) {
        setAppliedCoupon(JSON.parse(savedCoupon) as CouponValidationResultDto);
      }
    } catch {
      // JSON parse hatası durumunda sessiz kal
    }
  }, []);

  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    city: '',
    district: '',
    fullAddress: ''
  });

  useEffect(() => {
    const fetchUserAddresses = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      try {
        const res = await apiClient.get<ApiResponse<AddressDto[]>>('/addresses');
        if (res.data?.isSuccess && res.data.data && res.data.data.length > 0) {
          const list = res.data.data;
          setSavedAddresses(list);
          const defaultAddr = list.find((a) => a.isDefault) || list[0];
          setSelectedAddressId(defaultAddr.id);
          setAddress({
            fullName: defaultAddr.fullName,
            phone: defaultAddr.phoneNumber,
            city: defaultAddr.city,
            district: defaultAddr.district,
            fullAddress: defaultAddr.detailedAddress
          });
        } else {
          setIsNewAddressFormOpen(true);
        }
      } catch {
        setIsNewAddressFormOpen(true);
      }
    };
    fetchUserAddresses();
  }, []);

  const [card, setCard] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: ''
  });

  const selectedCityData = TURKEY_CITIES.find((c) => c.name === address.city);
  const allCityNames = TURKEY_CITIES.map((c) => c.name);
  const availableDistricts = selectedCityData?.districts || [];

  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    setAddress({ ...address, phone: raw });
  };

  const handleCardNumberChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCard({ ...card, number: formatted });
  };

  const handleCardExpiryChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCard({ ...card, expiry: `${raw.slice(0, 2)}/${raw.slice(2)}` });
    } else {
      setCard({ ...card, expiry: raw });
    }
  };

  const handleCardCvvChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 3);
    setCard({ ...card, cvv: digits });
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.fullName.trim() || !address.phone.trim() || !address.city || !address.district || !address.fullAddress.trim()) {
      setErrorMessage('Lütfen tüm adres bilgilerini eksiksiz doldurun.');
      return;
    }

    if (address.phone.length < 10) {
      setErrorMessage('Lütfen geçerli bir telefon numarası (En az 10 hane) giriniz.');
      return;
    }

    setErrorMessage(null);
    setStep(2);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const cleanCardNumber = card.number.replace(/\s+/g, '');

    if (cleanCardNumber.length < 15) {
      setErrorMessage('Lütfen 15 veya 16 haneli geçerli bir kart numarası giriniz.');
      setIsLoading(false);
      return;
    }

    if (!validateLuhn(cleanCardNumber)) {
      setErrorMessage('Kredi kartı numarası doğrulanamadı. Lütfen kart numaranızı kontrol ediniz.');
      setIsLoading(false);
      return;
    }

    const [month, year] = card.expiry.split('/');
    if (!month || !year || month.length !== 2 || year.length !== 2) {
      setErrorMessage('Lütfen son kullanma tarihini AA/YY formatında geçerli olarak giriniz.');
      setIsLoading(false);
      return;
    }

    const monthNum = parseInt(month, 10);
    if (monthNum < 1 || monthNum > 12) {
      setErrorMessage('Son kullanma ayı 01 ile 12 arasında olmalıdır.');
      setIsLoading(false);
      return;
    }

    const fullYear = `20${year}`;

    if (card.cvv.length < 3) {
      setErrorMessage('Lütfen 3 haneli güvenlik kodunu (CVV) giriniz.');
      setIsLoading(false);
      return;
    }

    try {
      const fullShippingAddress = `${address.fullName} - Tel: ${address.phone} - Adres: ${address.fullAddress} ${address.district}/${address.city}`;

      const response = await apiClient.post<ApiResponse<OrderDto>>('/orders', {
        shippingAddress: fullShippingAddress,
        couponCode: appliedCoupon?.couponCode || null,
        paymentInfo: {
          cardHolderName: card.holder.trim(),
          cardNumber: cleanCardNumber,
          expirationMonth: month.trim(),
          expirationYear: fullYear,
          cvv: card.cvv.trim()
        }
      });

      if (response.data?.isSuccess) {
        setCreatedOrderNumber(response.data.data?.orderNumber || 'NXR-2026-TEMP');
        sessionStorage.removeItem('appliedCoupon');
        await clearCart();
        await refreshCart();
      } else {
        setErrorMessage(response.data?.message || 'Ödeme ve sipariş işlemi başarısız.');
      }
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string; errors?: string[] }>;
      const apiErrors = error.response?.data?.errors;
      if (apiErrors && apiErrors.length > 0) {
        setErrorMessage(apiErrors[0]);
      } else {
        setErrorMessage(error.response?.data?.message || 'Ödeme doğrulanırken bir hata oluştu. Kart bilgilerinizi kontrol edin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const cardBrand = getCardBrand(card.number);
  const cartItems = cart?.items || [];
  const cartGrandTotal = cart?.grandTotal || 0;
  const shippingFee = cartGrandTotal > 500 || cartGrandTotal === 0 ? 0 : 39.90;
  const discountAmount = appliedCoupon ? appliedCoupon.calculatedDiscountAmount : 0;
  const payableTotal = Math.max(0, cartGrandTotal + shippingFee - discountAmount);

  if (createdOrderNumber) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4 py-12">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-2">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Siparişiniz Başarıyla Alındı!</h1>
        <p className="text-sm text-slate-500 max-w-md">
          Sipariş numaranız <strong className="text-slate-800 font-mono font-bold">#{createdOrderNumber}</strong>. Siparişinizin detaylarını profilinizdeki <strong>Siparişlerim</strong> sekmesinden canlı takip edebilirsiniz.
        </p>
        <div className="pt-6 flex gap-4">
          <Link
            to="/orders"
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Siparişlerimi Görüntüle
          </Link>
          <Link
            to="/"
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Alışverişe Devam Et
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Ödeme Yapılacak Ürün Bulunamadı</h2>
        <p className="text-xs text-slate-400">Sepetiniz boş olduğu için ödeme adımına devam edemezsiniz.</p>
        <Link to="/products" className="px-5 py-2.5 bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md">
          Ürünleri Keşfet
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 font-sans max-w-6xl mx-auto">
      <div className="flex items-center justify-center gap-4 text-xs font-bold pt-4">
        <div className={`flex items-center gap-2 ${step === 1 ? 'text-orange-600' : 'text-emerald-600'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${step === 1 ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'}`}>
            1
          </span>
          <span>Teslimat Adresi</span>
        </div>
        <div className="w-12 h-0.5 bg-slate-200" />
        <div className={`flex items-center gap-2 ${step === 2 ? 'text-orange-600' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${step === 2 ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
            2
          </span>
          <span>Ödeme Bilgileri</span>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 max-w-4xl mx-auto shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          {step === 1 && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  <span>Teslimat Adresi Seçimi</span>
                </h2>
                {savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewAddressFormOpen(!isNewAddressFormOpen);
                      if (!isNewAddressFormOpen) {
                        setSelectedAddressId('custom');
                        setAddress({
                          fullName: '',
                          phone: '',
                          city: '',
                          district: '',
                          fullAddress: ''
                        });
                      }
                    }}
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
                          onClick={() => {
                            setSelectedAddressId(addr.id);
                            setAddress({
                              fullName: addr.fullName,
                              phone: addr.phoneNumber,
                              city: addr.city,
                              district: addr.district,
                              fullAddress: addr.detailedAddress
                            });
                          }}
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
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Ad Soyad *</label>
                      <input
                        type="text"
                        required
                        maxLength={100}
                        placeholder="Örn: Ahmet Yılmaz"
                        value={address.fullName}
                        onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                        className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Telefon Numarası *</label>
                      <input
                        type="tel"
                        required
                        maxLength={11}
                        placeholder="05XXXXXXXXX"
                        value={address.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold font-mono focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <SearchableSelect
                        label="İl"
                        required
                        placeholder="İl Seçiniz..."
                        options={allCityNames}
                        value={address.city}
                        onChange={(val) => {
                          setAddress({ ...address, city: val, district: '' });
                        }}
                      />
                    </div>

                    <div>
                      <SearchableSelect
                        label="İlçe"
                        required
                        disabled={!address.city}
                        placeholder="İlçe Seçiniz..."
                        options={availableDistricts}
                        value={address.district}
                        onChange={(val) => {
                          setAddress({ ...address, district: val });
                        }}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Açık Adres (Cadde, Mahalle, Sokak, No, Daire) *</label>
                      <textarea
                        rows={3}
                        required
                        maxLength={500}
                        placeholder="Kargo görevlisinin paketi kolayca ulaştırabilmesi için detaylı adresinizi giriniz..."
                        value={address.fullAddress}
                        onChange={(e) => setAddress({ ...address, fullAddress: e.target.value })}
                        className="w-full bg-slate-50/80 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-orange-500 focus:bg-white transition-all leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                <span>Ödeme Adımına Geç</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-orange-500" />
                  <span>Kredi / Banka Kartı ile Ödeme</span>
                </h2>
                <button onClick={() => setStep(1)} className="text-xs font-bold text-orange-600 hover:underline cursor-pointer">
                  Adresi Değiştir
                </button>
              </div>

              <div className="w-full max-w-sm mx-auto h-48 [perspective:1000px]">
                <div
                  className={`relative w-full h-full duration-500 [transform-style:preserve-3d] transition-transform ${
                    isFlipped ? '[transform:rotateY(180deg)]' : ''
                  }`}
                >
                  <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 text-white p-6 shadow-xl flex flex-col justify-between [backface-visibility:hidden]">
                    <div className="flex items-center justify-between">
                      <span className="font-black italic text-lg tracking-wider text-orange-500">NEXORA</span>
                      <div className="flex items-center gap-2">
                        {cardBrand === 'visa' && <span className="font-bold text-xs text-blue-400 font-mono tracking-widest">VISA</span>}
                        {cardBrand === 'mastercard' && <span className="font-bold text-xs text-amber-400 font-mono tracking-widest">MASTERCARD</span>}
                        {cardBrand === 'troy' && <span className="font-bold text-xs text-cyan-400 font-mono tracking-widest">TROY</span>}
                        {cardBrand === 'amex' && <span className="font-bold text-xs text-emerald-400 font-mono tracking-widest">AMEX</span>}
                        <Lock className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">Kart Numarası</span>
                      <p className="text-lg font-mono tracking-widest font-bold">
                        {card.number || '•••• •••• •••• ••••'}
                      </p>
                    </div>
                    <div className="flex justify-between items-end text-xs font-mono">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Kart Sahibi</span>
                        <p className="font-bold uppercase truncate max-w-[150px]">{card.holder || 'AD SOYAD'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">SKT</span>
                        <p className="font-bold">{card.expiry || 'AA/YY'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl flex flex-col justify-between py-5 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                    <div className="w-full h-10 bg-slate-950 mt-1" />
                    <div className="px-6 space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>GÜVENLİK KODU</span>
                        <span>CVV</span>
                      </div>
                      <div className="bg-white text-slate-900 font-mono font-bold text-sm tracking-widest px-3 py-1.5 rounded text-right">
                        {card.cvv || '•••'}
                      </div>
                    </div>
                    <div className="px-6 text-[9px] text-slate-400 font-mono text-center">
                      nexora.com güvenli ödeme altyapısı
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kart Üzerindeki İsim</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="Kart üzerindeki tam ad ve soyad"
                    value={card.holder}
                    onFocus={() => setIsFlipped(false)}
                    onChange={(e) => setCard({ ...card, holder: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kart Numarası</label>
                  <input
                    type="text"
                    required
                    maxLength={19}
                    placeholder="0000 0000 0000 0000"
                    value={card.number}
                    onFocus={() => setIsFlipped(false)}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold font-mono focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Son Kullanma Tarihi</label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      placeholder="AA/YY"
                      value={card.expiry}
                      onFocus={() => setIsFlipped(false)}
                      onChange={(e) => handleCardExpiryChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold font-mono text-center focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Güvenlik Kodu (CVV)</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      placeholder="•••"
                      value={card.cvv}
                      onFocus={() => setIsFlipped(true)}
                      onBlur={() => setIsFlipped(false)}
                      onChange={(e) => handleCardCvvChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold font-mono text-center focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isLoading ? 'Ödeme Doğrulanıyor...' : `${payableTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL Güvenli Öde`}</span>
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Sipariş Özeti ({cartItems.length} Ürün)
            </h3>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center shrink-0">
                      <img
                        src={resolveImageUrl(item.productImageUrl)}
                        alt={item.productName}
                        className="max-h-full object-contain"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 line-clamp-1 max-w-[140px]">{item.productName}</h4>
                      <span className="text-[11px] text-slate-400 font-medium">{item.quantity} Adet</span>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">
                    {item.totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Ara Toplam</span>
                <span>{cartGrandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
              </div>
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Kargo</span>
                <span className={shippingFee === 0 ? 'text-emerald-600 font-bold' : ''}>
                  {shippingFee === 0 ? 'BEDAVA' : `${shippingFee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold items-center">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Kupon İndirimi ({appliedCoupon?.couponCode})
                  </span>
                  <span>-{discountAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-100">
                <span>Toplam Tutar</span>
                <span className="text-orange-600 font-black">{payableTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
