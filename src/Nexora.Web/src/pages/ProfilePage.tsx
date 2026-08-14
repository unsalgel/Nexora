import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
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
  Edit2, 
  Plus, 
  ChevronRight,
  LogOut,
  Clock
} from 'lucide-react';

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
}

export const ProfilePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = (searchParams.get('tab') as 'orders' | 'favorites' | 'addresses' | 'account') || 'orders';
  const [activeTab, setActiveTab] = useState<'orders' | 'favorites' | 'addresses' | 'account'>(initialTab);
  
  const { favorites, toggleFavorite, refreshFavorites } = useFavorites();
  const [userProfile, setUserProfile] = useState<{ firstName: string; lastName: string; email: string } | null>(null);

  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'favorites' || tabParam === 'orders' || tabParam === 'addresses' || tabParam === 'account') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

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
      console.error('Siparişler çekilirken hata oluştu:', error);
    } finally {
      setIsOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('accessToken')) {
      fetchOrders();
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'Pending':
        return { label: 'Hazırlanıyor', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'Preparing':
        return { label: 'Hazırlanıyor', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'Shipped':
        return { label: 'Kargoda', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'Delivered':
        return { label: 'Teslim Edildi', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'Cancelled':
        return { label: 'İptal Edildi', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: 'Hazırlanıyor', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Üst Yol */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <span className="hover:text-orange-600 cursor-pointer" onClick={() => navigate('/')}>Ana Sayfa</span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-800 font-semibold">Hesabım</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* SOL MENÜ */}
        <aside className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
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
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'orders' 
                  ? 'bg-orange-50 text-orange-600 border border-orange-200/80' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Siparişlerim</span>
            </button>

            <button
              onClick={() => { setActiveTab('favorites'); navigate('/profile?tab=favorites'); }}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'favorites' 
                  ? 'bg-orange-50 text-orange-600 border border-orange-200/80' 
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
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'addresses' 
                  ? 'bg-orange-50 text-orange-600 border border-orange-200/80' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Adreslerim</span>
            </button>

            <button
              onClick={() => { setActiveTab('account'); navigate('/profile?tab=account'); }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'account' 
                  ? 'bg-orange-50 text-orange-600 border border-orange-200/80' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Kişisel Bilgilerim</span>
            </button>

            <div className="border-t border-slate-100 my-1" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Çıkış Yap</span>
            </button>
          </nav>
        </aside>

        {/* SAĞ İÇERİK PANELSİ */}
        <main className="lg:col-span-9 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm min-h-[50vh]">
          
          {activeTab === 'orders' && (
            <div className="space-y-4 animate-in fade-in-50">
              <h2 className="text-base font-bold text-slate-900">Siparişlerim</h2>
              
              {isOrdersLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center space-y-3">
                  <Package className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">Henüz bir siparişiniz bulunmuyor.</p>
                </div>
              ) : (
                orders.map((order) => {
                  const statusInfo = getStatusDetails(order.status);
                  const orderDate = new Date(order.createdAtUtc).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  });

                  return (
                    <div key={order.id} className="border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-slate-400 font-medium block text-[11px]">Sipariş Numarası</span>
                          <span className="font-bold text-slate-800 text-xs">#{order.orderNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium block text-[11px]">Sipariş Tarihi</span>
                          <span className="font-bold text-slate-700 text-xs">{orderDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium block text-[11px]">Toplam Tutar</span>
                          <span className="font-bold text-orange-600 text-xs">{order.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                        </div>
                        <span className={`px-3 py-1 rounded-xl text-[10px] font-bold border self-start sm:self-auto ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-xl bg-slate-50 border p-1.5 shrink-0 flex items-center justify-center">
                              <img 
                                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80" 
                                alt={item.productName} 
                                className="max-h-full object-contain" 
                              />
                            </div>
                            <div className="flex-1 text-xs">
                              <h4 className="font-semibold text-slate-800 line-clamp-1">{item.productName}</h4>
                              <span className="text-slate-400 font-medium">{item.quantity} Adet • {item.unitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Sipariş Durumu: <span className="font-bold text-slate-700">{statusInfo.label}</span></span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Tahmini Teslimat: 3 İş Günü</span>
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
                    <div key={item.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3 flex flex-col justify-between relative">
                      <button
                        onClick={() => toggleFavorite(item)}
                        className="absolute top-3 right-3 text-rose-500 hover:text-rose-700 transition-colors p-1"
                        title="Favoriden Çıkar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="h-40 bg-slate-50 rounded-xl p-3 flex items-center justify-center">
                        <img src={item.image} alt={item.title} className="max-h-full object-contain" />
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-xs font-semibold text-slate-800 line-clamp-2">{item.title}</h3>
                        <div className="flex items-baseline gap-2 pt-1">
                          <span className="text-sm font-bold text-slate-900">
                            {item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                          </span>
                          <span className="text-[11px] text-slate-400 line-through">
                            {item.oldPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                          </span>
                        </div>
                      </div>

                      <button className="w-full py-2 bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all">
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
            <div className="space-y-4 animate-in fade-in-50">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Kayıtlı Adreslerim</h2>
                <button className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all">
                  <Plus className="w-4 h-4" />
                  <span>Yeni Adres Ekle</span>
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-900 bg-orange-50 text-orange-600 px-2.5 py-1 rounded-lg border border-orange-100">
                    Ev Adresim (Varsayılan)
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="text-xs font-bold text-slate-500 hover:text-orange-600 flex items-center gap-1">
                      <Edit2 className="w-3.5 h-3.5" /> Düzenle
                    </button>
                  </div>
                </div>
                <div className="text-xs text-slate-600 space-y-1 font-medium">
                  <p className="font-bold text-slate-900">
                    {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Yükleniyor...'}
                  </p>
                  <p>Cemal Gürsel Cad. No:45 Kat:3 Daire:8</p>
                  <p>Karşıyaka / İzmir</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6 animate-in fade-in-50">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Kişisel Bilgiler</h2>

              <form className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Ad Soyad</label>
                    <input
                      type="text"
                      readOnly
                      value={userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : ''}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">E-Posta Adresi</label>
                    <input
                      type="email"
                      readOnly
                      value={userProfile?.email || ''}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </form>
            </div>
          )}

        </main>

      </div>
    </div>
  );
};
