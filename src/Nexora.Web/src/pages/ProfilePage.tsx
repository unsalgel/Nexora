import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';
import { decodeJwt } from '../lib/jwt';
import { apiClient } from '../lib/apiClient';
import type { ApiResponse, PagedResponse } from '../lib/apiClient';
import { 
  Package, 
  Heart, 
  MapPin, 
  User, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  ChevronRight,
  LogOut,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  X,
  Star
} from 'lucide-react';
import type { AddressDto } from '../types/address';
import { TURKEY_CITIES } from '../data/turkeyLocations';
import { SearchableSelect } from '../components/ui/SearchableSelect';


interface OrderItemDto {
  id: string;
  productId?: string;
  productName: string;
  productVariantId?: string;
  variantSKU?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

interface OrderDto {
  id: string;
  orderNumber: string;
  userId: string;
  shippingAddress: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAtUtc: string;
  items: OrderItemDto[];
  trackingNumber?: string | null;
  carrier?: string | null;
}

export const ProfilePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const getInitialTab = (): 'orders' | 'favorites' | 'addresses' | 'account' => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'favorites' || tabParam === 'orders' || tabParam === 'addresses' || tabParam === 'account') return tabParam;
    if (location.pathname === '/favorites') return 'favorites';
    if (location.pathname === '/orders') return 'orders';
    return 'orders';
  };
  const [activeTab, setActiveTab] = useState<'orders' | 'favorites' | 'addresses' | 'account'>(getInitialTab);
  const { favorites, toggleFavorite, refreshFavorites } = useFavorites();
  const { addToCart } = useCart();
  const [userProfile, setUserProfile] = useState<{ firstName: string; lastName: string; email: string } | null>(null);

  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Adres Yönetimi State'leri
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [isAddressesLoading, setIsAddressesLoading] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    title: '',
    fullName: '',
    phoneNumber: '',
    city: '',
    district: '',
    detailedAddress: '',
    postalCode: '',
    isDefault: false
  });
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'favorites' || tabParam === 'orders' || tabParam === 'addresses' || tabParam === 'account') {
      setActiveTab(tabParam);
    } else if (location.pathname === '/favorites') {
      setActiveTab('favorites');
    } else if (location.pathname === '/orders') {
      setActiveTab('orders');
    }
  }, [searchParams, location.pathname]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const claims = decodeJwt(token);
      if (claims) {
        setUserProfile({
          firstName: claims.firstName,
          lastName: claims.lastName,
          email: claims.email
        });
        setNewAddress((prev) => ({
          ...prev,
          fullName: `${claims.firstName} ${claims.lastName}`.trim()
        }));
      }
    } else {
      navigate('/login');
    }
    refreshFavorites();
  }, [navigate]);

  const fetchOrders = async () => {
    setIsOrdersLoading(true);
    try {
      const response = await apiClient.get<ApiResponse<PagedResponse<OrderDto>>>('/orders', {
        params: { page: 1, pageSize: 20 }
      });
      if (response.data?.isSuccess && response.data.data?.items) {
        setOrders(response.data.data.items);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsOrdersLoading(false);
    }
  };

  const fetchAddresses = async () => {
    setIsAddressesLoading(true);
    try {
      const response = await apiClient.get<ApiResponse<AddressDto[]>>('/addresses');
      if (response.data?.isSuccess && response.data.data) {
        setAddresses(response.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAddressesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders' && localStorage.getItem('accessToken')) {
      fetchOrders();
    } else if (activeTab === 'addresses' && localStorage.getItem('accessToken')) {
      fetchAddresses();
    }
  }, [activeTab]);

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError(null);
    if (!newAddress.title || !newAddress.fullName || !newAddress.phoneNumber || !newAddress.city || !newAddress.district || !newAddress.detailedAddress) {
      setAddressError('Lütfen zorunlu alanları eksiksiz doldurun.');
      return;
    }

    setIsSavingAddress(true);
    try {
      const res = await apiClient.post<ApiResponse<AddressDto>>('/addresses', newAddress);
      if (res.data?.isSuccess) {
        setIsAddressModalOpen(false);
        setNewAddress({
          title: '',
          fullName: userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : '',
          phoneNumber: '',
          city: '',
          district: '',
          detailedAddress: '',
          postalCode: '',
          isDefault: false
        });
        await fetchAddresses();
      }
    } catch (err: unknown) {
      console.error(err);
      setAddressError('Adres kaydedilirken bir hata oluştu.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await apiClient.delete(`/addresses/${addressId}`);
      await fetchAddresses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      await apiClient.put(`/addresses/${addressId}/default`);
      await fetchAddresses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusStepIndex = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'paid':
        return 1;
      case 'processing':
        return 2;
      case 'shipped':
        return 3;
      case 'delivered':
        return 4;
      case 'cancelled':
        return -1;
      default:
        return 1;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Teslim Edildi
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3.5 h-3.5" /> Kargoya Verildi
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Package className="w-3.5 h-3.5" /> Hazırlanıyor
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> İptal Edildi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5" /> Sipariş Alındı
          </span>
        );
    }
  };

  const orderSteps = [
    { label: 'Sipariş Alındı', icon: CheckCircle2 },
    { label: 'Hazırlanıyor', icon: Package },
    { label: 'Kargoya Verildi', icon: Truck },
    { label: 'Teslim Edildi', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-8 pb-16 font-sans">
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <span className="hover:text-orange-600 cursor-pointer" onClick={() => navigate('/')}>Ana Sayfa</span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-800 font-semibold">Hesabım</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-md shadow-orange-500/25">
              {userProfile?.firstName ? userProfile.firstName[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 truncate">
                {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Yükleniyor...'}
              </h2>
              <span className="text-[11px] text-slate-400 font-medium truncate block">{userProfile?.email}</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            <button
              onClick={() => { setActiveTab('orders'); navigate('/profile?tab=orders'); }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'orders' 
                  ? 'bg-orange-50 text-orange-600 border border-orange-200/80 shadow-2xs' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Siparişlerim</span>
            </button>

            <button
              onClick={() => { setActiveTab('favorites'); navigate('/profile?tab=favorites'); }}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'favorites' 
                  ? 'bg-orange-50 text-orange-600 border border-orange-200/80 shadow-2xs' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4" />
                <span>Favorilerim</span>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{favorites.length}</span>
            </button>

            <button
              onClick={() => { setActiveTab('addresses'); navigate('/profile?tab=addresses'); }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'addresses' 
                  ? 'bg-orange-50 text-orange-600 border border-orange-200/80 shadow-2xs' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Adreslerim</span>
            </button>

            <button
              onClick={() => { setActiveTab('account'); navigate('/profile?tab=account'); }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'account' 
                  ? 'bg-orange-50 text-orange-600 border border-orange-200/80 shadow-2xs' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Kişisel Bilgilerim</span>
            </button>

            <div className="border-t border-slate-100 my-1" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors w-full text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Çıkış Yap</span>
            </button>
          </nav>
        </aside>

        <main className="lg:col-span-9 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs min-h-[50vh]">
          {activeTab === 'orders' && (
            <div className="space-y-5 animate-in fade-in-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Siparişlerim</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Geçmiş ve devam eden tüm siparişlerinizin anlık kargo takip durumu
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  {orders.length} Sipariş
                </span>
              </div>
              
              {isOrdersLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 border border-slate-200/80 text-center space-y-3">
                  <Package className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold">Henüz verilmiş bir siparişiniz bulunmuyor.</p>
                  <button
                    onClick={() => navigate('/products')}
                    className="mt-2 px-5 py-2.5 bg-orange-500 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-orange-600 transition-all cursor-pointer"
                  >
                    Alışverişe Başla
                  </button>
                </div>
              ) : (
                orders.map((order) => {
                  const currentStep = getStatusStepIndex(order.status);
                  const isCancelled = order.status.toLowerCase() === 'cancelled';
                  const orderDate = new Date(order.createdAtUtc).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div key={order.id} className="border border-slate-200/90 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xs hover:shadow-sm transition-all bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div>
                          <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">Sipariş No</span>
                          <span className="font-extrabold text-slate-900 text-xs font-mono">{order.orderNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">Sipariş Tarihi</span>
                          <span className="font-bold text-slate-700 text-xs">{orderDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">Toplam Tutar</span>
                          <span className="font-black text-orange-600 text-sm">
                            {order.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                          </span>
                        </div>
                        <div>
                          {getStatusBadge(order.status)}
                        </div>
                      </div>

                      {!isCancelled ? (
                        <div className="py-3 px-2 space-y-4">
                          <div className="grid grid-cols-4 relative">
                            <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 h-1 bg-slate-100 z-0" />
                            <div 
                              className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-orange-500 z-0 transition-all duration-500"
                              style={{ width: `${((Math.max(1, currentStep) - 1) / 3) * 100}%` }}
                            />

                            {orderSteps.map((step, idx) => {
                              const stepNum = idx + 1;
                              const isCompleted = stepNum <= currentStep;
                              const isCurrent = stepNum === currentStep;
                              const Icon = step.icon;

                              return (
                                <div key={step.label} className="relative z-10 flex flex-col items-center text-center gap-2">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                    isCompleted 
                                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 ring-4 ring-orange-50' 
                                      : 'bg-white border-2 border-slate-200 text-slate-300'
                                  }`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <span className={`text-[11px] font-bold tracking-tight ${
                                    isCurrent ? 'text-orange-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                                  }`}>
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Kargo Takip Kartı */}
                          {order.trackingNumber && (
                            <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/70 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/30 shrink-0">
                                  <Truck className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900">
                                      {order.carrier || 'Kargo Firması'}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                                      Yolda
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600">
                                    <span>Takip No:</span>
                                    <strong className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-blue-200/80">
                                      {order.trackingNumber}
                                    </strong>
                                    <button
                                      onClick={() => handleCopy(order.trackingNumber!)}
                                      className="p-1 hover:bg-blue-100/60 rounded-md text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                                      title="Takip Kodu Kopyala"
                                    >
                                      {copiedCode === order.trackingNumber ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <a
                                href={`https://www.google.com/search?q=${encodeURIComponent((order.carrier || 'kargo') + ' takip ' + order.trackingNumber)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-bold transition-all shadow-2xs border border-blue-200 cursor-pointer self-start sm:self-auto"
                              >
                                <span>Kargom Nerede</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2">
                          <XCircle className="w-4 h-4 shrink-0" />
                          <span>Bu sipariş iptal edilmiştir. Ücret iadeniz bankanıza aktarılmıştır.</span>
                        </div>
                      )}

                      <div className="space-y-3 pt-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Sipariş Edilen Ürünler</span>
                        <div className="border border-slate-100 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="p-3.5 bg-slate-50/50 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 p-1 shrink-0 flex items-center justify-center">
                                  <Package className="w-6 h-6 text-slate-400" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900 text-xs">{item.productName}</h4>
                                  {item.variantSKU && (
                                    <span className="text-[10px] text-slate-400 font-mono block">SKU: {item.variantSKU}</span>
                                  )}
                                  <span className="text-slate-500 text-[11px] font-medium">
                                    {item.quantity} Adet x {item.unitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                  </span>
                                </div>
                              </div>
                              <span className="font-extrabold text-slate-900 text-xs shrink-0">
                                {item.totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="line-clamp-1">{order.shippingAddress}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold shrink-0">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Tahmini Teslimat: 2-3 İş Günü</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="space-y-4 animate-in fade-in-50">
              <h2 className="text-base font-bold text-slate-900">Favori Ürünlerim ({favorites.length})</h2>

              {favorites.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-3">
                  <Heart className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">Henüz favorilere ürün eklemediniz.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favorites.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3 flex flex-col justify-between relative">
                      <button
                        onClick={() => toggleFavorite(item)}
                        className="absolute top-3 right-3 text-rose-500 hover:text-rose-700 transition-colors p-1 cursor-pointer"
                        title="Favorilerden Çıkar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex gap-3.5">
                        <div className="w-16 h-16 rounded-xl bg-slate-50 border p-1 shrink-0 flex items-center justify-center">
                          <img src={item.image} alt={item.title} className="max-h-full object-contain" />
                        </div>
                        <div className="min-w-0 flex-1 pr-6">
                          <h3 className="text-xs font-bold text-slate-800 line-clamp-1">{item.title}</h3>
                          <div className="mt-1">
                            <span className="text-xs font-extrabold text-orange-600">
                              {item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => addToCart(item.id)}
                        className="w-full py-2 bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Sepete Ekle</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="space-y-5 animate-in fade-in-50">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Kayıtlı Adreslerim</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Siparişlerinizde hızlı teslimat için kayıtlı adreslerinizi yönetin
                  </p>
                </div>
                <button 
                  onClick={() => setIsAddressModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Adres Ekle</span>
                </button>
              </div>

              {isAddressesLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : addresses.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 border border-slate-200/80 text-center space-y-3">
                  <MapPin className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold">Henüz kayıtlı bir adresiniz bulunmamaktadır.</p>
                  <button
                    onClick={() => setIsAddressModalOpen(true)}
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
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-slate-500 hover:text-orange-600 font-semibold text-[11px] cursor-pointer"
                          >
                            Varsayılan Yap
                          </button>
                        ) : <div />}

                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-rose-500 hover:text-rose-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-4 animate-in fade-in-50">
              <h2 className="text-base font-bold text-slate-900">Kişisel Bilgilerim</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Ad</label>
                  <input
                    type="text"
                    disabled
                    value={userProfile?.firstName || ''}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Soyad</label>
                  <input
                    type="text"
                    disabled
                    value={userProfile?.lastName || ''}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">E-Posta Adresi</label>
                  <input
                    type="email"
                    disabled
                    value={userProfile?.email || ''}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700"
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Yeni Adres Ekleme Modalı */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                  <MapPin className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Yeni Teslimat Adresi</h2>
              </div>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addressError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                {addressError}
              </div>
            )}

            <form onSubmit={handleCreateAddress} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Adres Başlığı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Evim, İş Yeri, Yazlık"
                    value={newAddress.title}
                    onChange={(e) => setNewAddress({ ...newAddress, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Teslim Alacak Kişi (Ad Soyad) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Ahmet Yılmaz"
                    value={newAddress.fullName}
                    onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Telefon Numarası *</label>
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    placeholder="05XXXXXXXXX"
                    value={newAddress.phoneNumber}
                    onChange={(e) => setNewAddress({ ...newAddress, phoneNumber: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-medium focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Posta Kodu</label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="Örn: 34710"
                    value={newAddress.postalCode}
                    onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-medium focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <SearchableSelect
                    label="İl *"
                    required
                    placeholder="İl Seçiniz..."
                    options={TURKEY_CITIES.map((c) => c.name)}
                    value={newAddress.city}
                    onChange={(val) => setNewAddress({ ...newAddress, city: val, district: '' })}
                  />
                </div>

                <div>
                  <SearchableSelect
                    label="İlçe *"
                    required
                    disabled={!newAddress.city}
                    placeholder="İlçe Seçiniz..."
                    options={TURKEY_CITIES.find((c) => c.name === newAddress.city)?.districts || []}
                    value={newAddress.district}
                    onChange={(val) => setNewAddress({ ...newAddress, district: val })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Açık Adres (Cadde, Mahalle, Kapı No, Daire) *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Paketin sorunsuz teslim edilmesi için detaylı açık adresinizi giriniz..."
                    value={newAddress.detailedAddress}
                    onChange={(e) => setNewAddress({ ...newAddress, detailedAddress: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-orange-500 focus:bg-white transition-all leading-relaxed"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={newAddress.isDefault}
                    onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 border-slate-300"
                  />
                  <label htmlFor="isDefault" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Bu adresi varsayılan teslimat adresim olarak kaydet
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-all"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSavingAddress ? 'Kaydediliyor...' : 'Adresi Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
