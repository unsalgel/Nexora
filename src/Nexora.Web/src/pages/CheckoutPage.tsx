import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createOrderAttempt } from '../features/checkout/orderAttempt';
import { Link } from 'react-router-dom';
import { type AxiosError } from 'axios';
import { AlertCircle } from 'lucide-react';
import { getAccessToken } from '../lib/session';
import { useCartQuote } from '../hooks/useCartQuote';
import { getQuotedCartItems } from '../lib/cartQuote';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { extractApiErrorMessage } from '../lib/apiClient';
import type { CouponValidationResultDto } from '../types/coupon';
import type { AddressDto } from '../types/address';
import type { PaymentMethod } from '../types/payment';
import { validateLuhn, getCardBrand } from '../lib/cardValidation';
import { ShippingAddressSection } from '../components/checkout/ShippingAddressSection';
import { PaymentMethodSection } from '../components/checkout/PaymentMethodSection';
import { OrderSummarySection } from '../components/checkout/OrderSummarySection';
import { OrderSuccessView } from '../components/checkout/OrderSuccessView';
import { CouponBox } from '../components/common/CouponBox';
import { checkoutService } from '../features/checkout/checkoutService';
import { formatFullShippingAddress, validateAddressFormData, type AddressFormData } from '../features/checkout/addressUtils';
import {
  getTrustedPaymentUrl,
} from '../features/checkout/checkoutSecurity';

export const CheckoutPage: React.FC = () => {
  const orderAttempt = useRef(createOrderAttempt());
  const { cart, refreshCart, isMutating } = useCart();
  const { settings } = useSettings();
  const [step, setStep] = useState<1 | 2>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('iyzico');
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

  const [address, setAddress] = useState<AddressFormData>({
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
    } catch {
      // Ignore coupon parsing errors
    }
  }, []);

  useEffect(() => {
    return () => {
      // PCI-DSS: scrub in-memory card credentials on unmount
      setCard({ number: '', holder: '', expiry: '', cvv: '' });
    };
  }, []);

  useEffect(() => {
    const fetchUserAddresses = async () => {
      const token = getAccessToken();
      if (!token) return;
      try {
        const list = await checkoutService.fetchAddresses();
        if (list.length > 0) {
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
    const formatted = digits.match(/.{1,4}/g)?.join(' ') || '';
    setCard((prev) => ({ ...prev, number: formatted }));
  };

  const handleCardExpiryChange = (val: string) => {
    let clean = val.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 2) {
      clean = `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    setCard((prev) => ({ ...prev, expiry: clean }));
  };

  const handleCardCvvChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    setCard((prev) => ({ ...prev, cvv: clean }));
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'iyzico') {
      // PCI-DSS: wipe card info when switching away from direct entry
      setCard({ number: '', holder: '', expiry: '', cvv: '' });
      setIsFlipped(false);
    }
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateAddressFormData(address);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Lütfen adres bilgilerini kontrol ediniz.');
      return;
    }
    setErrorMessage(null);
    setStep(2);
  };

  const handleIyzicoPayment = async (fullShippingAddress: string) => {
    try {
      const data = await checkoutService.initializePayment({
        idempotencyKey: orderAttempt.current(JSON.stringify({
          method: 'iyzico', shippingAddress: fullShippingAddress, couponCode: appliedCoupon?.couponCode || null,
          expectedTotalAmount: quoteQuery.data?.totalAmount, items: cart?.items.map(item => [item.id, item.quantity]).sort(),
        })),
        shippingAddress: fullShippingAddress,
        expectedTotalAmount: quoteQuery.data?.totalAmount,
        couponCode: appliedCoupon?.couponCode || null,
      });

      const paymentUrl = getTrustedPaymentUrl(data.paymentPageUrl);
      if (!paymentUrl) throw new Error('Güvenli ödeme adresi alınamadı.');
      window.location.assign(paymentUrl);
    } catch (err: unknown) {
      setErrorMessage(extractApiErrorMessage(err, 'İyzico ödeme oturumu başlatılamadı.'));
    }
  };

  const handleDirectPayment = async (fullShippingAddress: string) => {
    const cleanCardNumber = card.number.replace(/\s/g, '');
    if (!validateLuhn(cleanCardNumber)) {
      setErrorMessage('Geçersiz kart numarası. Lütfen kontrol ediniz.');
      return;
    }

    const [month, year] = card.expiry.split('/');
    if (!month || !year || month.length !== 2 || year.length !== 2) {
      setErrorMessage('Lütfen geçerli bir son kullanma tarihi giriniz (AA/YY).');
      return;
    }

    const m = parseInt(month, 10);
    if (m < 1 || m > 12) {
      setErrorMessage('Son kullanma ayı 01 ile 12 arasında olmalıdır.');
      return;
    }

    const fullYear = `20${year}`;
    if (card.cvv.length < 3) {
      setErrorMessage('Lütfen 3 haneli güvenlik kodunu (CVV) giriniz.');
      return;
    }

    const idempotencyKey = orderAttempt.current(
      JSON.stringify({
        shippingAddress: fullShippingAddress,
        couponCode: appliedCoupon?.couponCode || null,
        expectedTotalAmount: quoteQuery.data?.totalAmount,
        items: cart?.items.map((item) => [item.id, item.quantity]).sort(),
      })
    );

    const orderData = await checkoutService.submitDirectOrder({
      idempotencyKey,
      shippingAddress: fullShippingAddress,
      expectedTotalAmount: quoteQuery.data?.totalAmount,
      couponCode: appliedCoupon?.couponCode || null,
      paymentInfo: {
        cardHolderName: card.holder.trim(),
        cardNumber: cleanCardNumber,
        expirationMonth: month.trim(),
        expirationYear: fullYear,
        cvv: card.cvv.trim(),
      },
    });

    setCreatedOrderNumber(orderData.orderNumber || 'NXR-2026-TEMP');
    sessionStorage.removeItem('appliedCoupon');
    setCard({ number: '', holder: '', expiry: '', cvv: '' });

    if ((isNewAddressFormOpen || savedAddresses.length === 0) && shouldSaveAddress) {
      try {
        await checkoutService.saveAddress({
          title: addressTitle.trim() || 'Evim',
          fullName: address.fullName.trim(),
          phoneNumber: address.phone.trim(),
          city: address.city,
          district: address.district,
          detailedAddress: address.fullAddress.trim(),
          postalCode: '',
          isDefault: savedAddresses.length === 0,
        });
      } catch {
        // Address save non-critical failure
      }
    }

    await refreshCart();
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (quoteQuery.isFetching) {
      setErrorMessage('Sepet tutarı güncelleniyor. Lütfen bekleyiniz.');
      return;
    }

    if (quoteQuery.isError || !quoteQuery.data) {
      setErrorMessage('Güncel sepet tutarı hesaplanamadı. Lütfen tekrar deneyiniz.');
      return;
    }

    setIsLoading(true);
    const fullShippingAddress = formatFullShippingAddress(address);

    try {
      if (paymentMethod === 'iyzico') {
        await handleIyzicoPayment(fullShippingAddress);
      } else {
        await handleDirectPayment(fullShippingAddress);
      }
    } catch (err: unknown) {
      const error = err as AxiosError;
      if (error.response?.status === 409) {
        await refreshCart();
      }
      setErrorMessage(extractApiErrorMessage(err, 'İşlem sırasında bir hata oluştu.'));
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-8">
        <Link to="/cart" className="text-slate-400 hover:text-slate-600 transition-colors">
          Sepetim
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-bold text-slate-900">Siparişi Tamamla</span>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-rose-800">İşlem Başarısız</h4>
            <p className="text-xs text-rose-600 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                step === 1 ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>1. Adres Bilgileri</span>
            </button>
            <button
              onClick={() => {
                if (address.fullName && address.phone && address.city && address.district && address.fullAddress) {
                  setStep(2);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                step === 2 ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>2. Ödeme Seçenekleri</span>
            </button>
          </div>

          {step === 1 && (
            <ShippingAddressSection
              savedAddresses={savedAddresses}
              selectedAddressId={selectedAddressId}
              isNewAddressFormOpen={isNewAddressFormOpen}
              onToggleNewAddressForm={() => setIsNewAddressFormOpen((prev) => !prev)}
              addressTitle={addressTitle}
              onAddressTitleChange={setAddressTitle}
              shouldSaveAddress={shouldSaveAddress}
              onToggleShouldSaveAddress={() => setShouldSaveAddress((prev) => !prev)}
              address={address}
              onAddressChange={(fields) => setAddress((prev) => ({ ...prev, ...fields }))}
              onSelectAddress={(addr: AddressDto) => {
                setSelectedAddressId(addr.id);
                setAddress({
                  fullName: addr.fullName,
                  phone: addr.phoneNumber,
                  city: addr.city,
                  district: addr.district,
                  fullAddress: addr.detailedAddress,
                });
              }}
              onPhoneChange={handlePhoneChange}
              onNextStep={handleAddressSubmit}
            />
          )}

          {step === 2 && (
            <PaymentMethodSection
              paymentMethod={paymentMethod}
              onPaymentMethodChange={handlePaymentMethodChange}
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

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs">
            <CouponBox
              appliedCoupon={appliedCoupon}
              cartSubtotal={subtotal}
              discountAmount={discountAmount}
              onCouponApplied={(coupon) => {
                setAppliedCoupon(coupon);
                sessionStorage.setItem('appliedCoupon', JSON.stringify(coupon));
              }}
              onCouponRemoved={() => {
                setAppliedCoupon(null);
                sessionStorage.removeItem('appliedCoupon');
              }}
              disabled={isLoading}
            />
          </div>

          <OrderSummarySection
            cartItems={cartItems}
            subtotal={subtotal}
            shippingFee={shippingFee}
            discountAmount={discountAmount}
            payableTotal={payableTotal}
            couponCode={appliedCoupon?.couponCode}
          />
        </div>
      </div>

    </div>
  );
};
