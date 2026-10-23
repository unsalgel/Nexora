import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { AlertCircle } from 'lucide-react';
import { getAccessToken } from '../lib/session';
import { useCartQuote } from '../hooks/useCartQuote';
import { getQuotedCartItems } from '../lib/cartQuote';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { apiClient } from '../lib/apiClient';
import type { ApiResponse } from '../lib/apiClient';
import type { CouponValidationResultDto } from '../types/coupon';
import type { AddressDto } from '../types/address';
import type { OrderDto } from '../types/order';
import { validateLuhn, getCardBrand } from '../lib/cardValidation';
import { ShippingAddressSection } from '../components/checkout/ShippingAddressSection';
import { PaymentMethodSection } from '../components/checkout/PaymentMethodSection';
import { OrderSummarySection } from '../components/checkout/OrderSummarySection';
import { OrderSuccessView } from '../components/checkout/OrderSuccessView';

export const CheckoutPage: React.FC = () => {
  const { cart, refreshCart, isMutating } = useCart();
  const { settings } = useSettings();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResultDto | null>(null);
  const quoteQuery = useCartQuote(appliedCoupon?.couponCode);

  const [savedAddresses, setSavedAddresses] = useState<AddressDto[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'custom'>('custom');
  const [isNewAddressFormOpen, setIsNewAddressFormOpen] = useState(false);
  const [addressTitle, setAddressTitle] = useState('Ev');
  const [shouldSaveAddress, setShouldSaveAddress] = useState(true);

  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    city: '',
    district: '',
    fullAddress: '',
  });

  const [card, setCard] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: '',
  });

  useEffect(() => {
    try {
      const savedCoupon = sessionStorage.getItem('appliedCoupon');
      if (savedCoupon) {
        setAppliedCoupon(JSON.parse(savedCoupon) as CouponValidationResultDto);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const fetchUserAddresses = async () => {
      const token = getAccessToken();
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
            fullAddress: defaultAddr.detailedAddress,
          });
        } else {
          setIsNewAddressFormOpen(true);
        }
      } catch {
        setErrorMessage('Kayıtlı adresler yüklenemedi. Adresinizi elle girebilir veya sayfayı yenileyebilirsiniz.');
        setIsNewAddressFormOpen(true);
      }
    };
    void fetchUserAddresses();
  }, []);

  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    setAddress((prev) => ({ ...prev, phone: raw }));
  };

  const handleCardNumberChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCard((prev) => ({ ...prev, number: formatted }));
  };

  const handleCardExpiryChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCard((prev) => ({ ...prev, expiry: `${raw.slice(0, 2)}/${raw.slice(2)}` }));
    } else {
      setCard((prev) => ({ ...prev, expiry: raw }));
    }
  };

  const handleCardCvvChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 3);
    setCard((prev) => ({ ...prev, cvv: digits }));
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
    if (isMutating || !quoteQuery.data || quoteQuery.isFetching || quoteQuery.isError) {
      setErrorMessage('Lütfen güncel sepet tutarının hesaplanmasını bekleyin.');
      return;
    }
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
        expectedTotalAmount: quoteQuery.data.totalAmount,
        couponCode: appliedCoupon?.couponCode || null,
        paymentInfo: {
          cardHolderName: card.holder.trim(),
          cardNumber: cleanCardNumber,
          expirationMonth: month.trim(),
          expirationYear: fullYear,
          cvv: card.cvv.trim(),
        },
      });

      if (response.data?.isSuccess) {
        setCreatedOrderNumber(response.data.data?.orderNumber || 'NXR-2026-TEMP');
        sessionStorage.removeItem('appliedCoupon');

        if ((isNewAddressFormOpen || savedAddresses.length === 0) && shouldSaveAddress) {
          try {
            await apiClient.post('/addresses', {
              title: addressTitle.trim() || 'Evim',
              fullName: address.fullName.trim(),
              phoneNumber: address.phone.trim(),
              city: address.city,
              district: address.district,
              detailedAddress: address.fullAddress.trim(),
              postalCode: '',
              isDefault: savedAddresses.length === 0,
            });
          } catch {}
        }

        await refreshCart();
      } else {
        setErrorMessage(response.data?.message || 'Ödeme ve sipariş işlemi başarısız.');
      }
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string; errors?: string[] }>;
      if (error.response?.status === 409) await refreshCart();
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
  const cartItems = useMemo(
    () => getQuotedCartItems(cart?.items || [], quoteQuery.data),
    [cart?.items, quoteQuery.data]
  );
  const subtotal = quoteQuery.data?.subtotal ?? cart?.grandTotal ?? 0;
  const isFreeShipping = subtotal >= settings.freeShippingThreshold || subtotal === 0;
  const shippingFee = quoteQuery.data?.shippingFee ?? (isFreeShipping ? 0 : settings.shippingCost);
  const discountAmount = quoteQuery.data?.discountAmount ?? 0;
  const payableTotal = quoteQuery.data?.totalAmount ?? 0;

  if (createdOrderNumber) {
    return <OrderSuccessView orderNumber={createdOrderNumber} />;
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
            <ShippingAddressSection
              savedAddresses={savedAddresses}
              selectedAddressId={selectedAddressId}
              onSelectAddress={(addr) => {
                setSelectedAddressId(addr.id);
                setAddress({
                  fullName: addr.fullName,
                  phone: addr.phoneNumber,
                  city: addr.city,
                  district: addr.district,
                  fullAddress: addr.detailedAddress,
                });
              }}
              isNewAddressFormOpen={isNewAddressFormOpen}
              onToggleNewAddressForm={() => {
                setIsNewAddressFormOpen(!isNewAddressFormOpen);
                if (!isNewAddressFormOpen) {
                  setSelectedAddressId('custom');
                  setAddress({
                    fullName: '',
                    phone: '',
                    city: '',
                    district: '',
                    fullAddress: '',
                  });
                }
              }}
              address={address}
              onAddressChange={(fields) => setAddress((prev) => ({ ...prev, ...fields }))}
              addressTitle={addressTitle}
              onAddressTitleChange={setAddressTitle}
              shouldSaveAddress={shouldSaveAddress}
              onToggleShouldSaveAddress={() => setShouldSaveAddress(!shouldSaveAddress)}
              onNextStep={handleNextStep}
              onPhoneChange={handlePhoneChange}
            />
          )}

          {step === 2 && (
            <PaymentMethodSection
              card={card}
              onCardHolderChange={(val) => setCard((prev) => ({ ...prev, holder: val }))}
              onCardNumberChange={handleCardNumberChange}
              onCardExpiryChange={handleCardExpiryChange}
              onCardCvvChange={handleCardCvvChange}
              isFlipped={isFlipped}
              setIsFlipped={setIsFlipped}
              cardBrand={cardBrand}
              payableTotal={payableTotal}
              isLoading={isLoading}
              isMutating={isMutating}
              quoteFetching={quoteQuery.isFetching}
              quoteError={quoteQuery.isError}
              onRefetchQuote={() => void quoteQuery.refetch()}
              onSubmitPayment={handlePaymentSubmit}
              onBackToAddress={() => setStep(1)}
            />
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <OrderSummarySection
            cartItems={cartItems}
            subtotal={subtotal}
            shippingFee={shippingFee}
            discountAmount={discountAmount}
            payableTotal={payableTotal}
            couponCode={appliedCoupon?.couponCode}
            appliedCoupon={appliedCoupon}
            onCouponApplied={(coupon) => {
              setAppliedCoupon(coupon);
              sessionStorage.setItem('appliedCoupon', JSON.stringify(coupon));
            }}
            onCouponRemoved={() => {
              setAppliedCoupon(null);
              sessionStorage.removeItem('appliedCoupon');
            }}
          />
        </div>
      </div>
    </div>
  );
};
