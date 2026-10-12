import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Package, Heart, MapPin, User, LogOut, ChevronRight } from 'lucide-react';
import { clearSession, getAccessToken } from '../lib/session';
import { decodeJwt } from '../lib/jwt';
import { apiClient, logout } from '../lib/apiClient';
import type { ApiResponse, PagedResponse } from '../lib/apiClient';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import type { AddressDto } from '../types/address';
import type { OrderDto } from '../types/order';
import type { UserProfileDto } from '../types/user';
import { OrderHistoryTab } from '../components/profile/OrderHistoryTab';
import { FavoritesTab } from '../components/profile/FavoritesTab';
import { AddressBookTab } from '../components/profile/AddressBookTab';
import { AccountSecurityTab } from '../components/profile/AccountSecurityTab';

export const ProfilePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { success: showSuccess, error: showError } = useToast();
  const { addToCart } = useCart();
  const {
    favorites,
    toggleFavorite,
    refreshFavorites,
    page: favoritesPage,
    setPage: setFavoritesPage,
    totalPages: favoritesPages,
    totalCount: favoritesCount,
    isLoading: isFavoritesLoading,
    isError: isFavoritesError,
  } = useFavorites();

  const getInitialTab = (): 'orders' | 'favorites' | 'addresses' | 'account' => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'favorites' || tabParam === 'orders' || tabParam === 'addresses' || tabParam === 'account') {
      return tabParam;
    }
    if (location.pathname === '/favorites') return 'favorites';
    if (location.pathname === '/orders') return 'orders';
    if (location.pathname === '/addresses') return 'addresses';
    return 'orders';
  };

  const [activeTab, setActiveTab] = useState<'orders' | 'favorites' | 'addresses' | 'account'>(getInitialTab);

  // Profil Verisi
  const [userProfile, setUserProfile] = useState<UserProfileDto | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Siparişler Verisi
  const [ordersPage, setOrdersPage] = useState(1);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const {
    data: ordersData,
    isLoading: isOrdersLoading,
    isError: isOrdersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['my-orders', ordersPage],
    enabled: activeTab === 'orders',
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PagedResponse<OrderDto>>>('/orders', {
        params: { page: ordersPage, pageSize: 10 },
      });
      if (!res.data.isSuccess) throw new Error(res.data.message);
      return res.data.data;
    },
  });

  // Adresler Verisi
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [isAddressesLoading, setIsAddressesLoading] = useState(false);
  const [addressesLoadError, setAddressesLoadError] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'favorites' || tabParam === 'orders' || tabParam === 'addresses' || tabParam === 'account') {
      setActiveTab(tabParam);
    } else if (location.pathname === '/favorites') {
      setActiveTab('favorites');
    } else if (location.pathname === '/orders') {
      setActiveTab('orders');
    } else if (location.pathname === '/addresses') {
      setActiveTab('addresses');
    }
  }, [searchParams, location.pathname]);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get<ApiResponse<UserProfileDto>>('/users/me');
      if (response.data?.isSuccess && response.data.data) {
        setUserProfile(response.data.data);
      }
    } catch {
      setProfileError('Profil bilgileri yüklenemedi. Lütfen hesabım sekmesini yeniden açın.');
    }
  };

  const fetchAddresses = async () => {
    setIsAddressesLoading(true);
    setAddressesLoadError(false);
    try {
      const response = await apiClient.get<ApiResponse<AddressDto[]>>('/addresses');
      if (response.data?.isSuccess && response.data.data) {
        setAddresses(response.data.data);
      } else {
        throw new Error(response.data.message);
      }
    } catch {
      setAddressesLoadError(true);
    } finally {
      setIsAddressesLoading(false);
    }
  };

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      const claims = decodeJwt(token);
      if (claims) {
        setUserProfile({
          id: claims.id || '',
          firstName: claims.firstName || '',
          lastName: claims.lastName || '',
          email: claims.email || '',
          isEmailConfirmed: true,
        });
        void fetchProfile();
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'addresses' && getAccessToken()) {
      void fetchAddresses();
    } else if (activeTab === 'account' && getAccessToken()) {
      void fetchProfile();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleOrderChange = () => {
      if (getAccessToken()) {
        void queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      }
    };
    window.addEventListener('nexora:order-status-changed', handleOrderChange);
    window.addEventListener('nexora:order-created', handleOrderChange);
    return () => {
      window.removeEventListener('nexora:order-status-changed', handleOrderChange);
      window.removeEventListener('nexora:order-created', handleOrderChange);
    };
  }, [queryClient]);

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Bu siparişi iptal etmek istediğinize emin misiniz?')) return;
    try {
      setCancellingOrderId(orderId);
      const response = await apiClient.post<ApiResponse<string>>(`/orders/${orderId}/cancel`);
      if (response.data?.isSuccess) {
        showSuccess(response.data.message || 'Siparişiniz başarıyla iptal edildi.');
        await queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      } else {
        showError(response.data?.message || 'Sipariş iptal edilemedi.');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showError(error.response?.data?.message || 'Sipariş iptal edilirken bir hata oluştu.');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleSaveProfile = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    currentPassword?: string;
  }) => {
    setProfileError(null);
    setProfileSuccess(null);

    const trimmedFirst = data.firstName.trim();
    const trimmedLast = data.lastName.trim();
    const trimmedEmail = data.email.trim();

    if (!trimmedFirst || !trimmedLast) {
      setProfileError('Ad ve soyad alanları zorunludur.');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setProfileError('Geçerli bir e-posta adresi giriniz.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await apiClient.put<ApiResponse<UserProfileDto>>('/users/me', {
        firstName: trimmedFirst,
        lastName: trimmedLast,
        email: trimmedEmail,
        currentPassword: data.currentPassword || undefined,
      });

      if (response.data?.isSuccess && response.data.data) {
        const updated = response.data.data;
        setUserProfile(updated);
        setProfileSuccess(
          updated.pendingEmail
            ? 'Yeni e-posta adresinize doğrulama kodu gönderildi. Doğrulama tamamlanana kadar mevcut adresiniz kullanılır.'
            : 'Kişisel bilgileriniz başarıyla güncellendi.'
        );
        showSuccess('Profil bilgileriniz başarıyla kaydedildi.');
      } else {
        const errorMsg = response.data?.message || 'Profil güncellenirken bir hata oluştu.';
        setProfileError(errorMsg);
        showError(errorMsg);
      }
    } catch (error) {
      let errorMsg = 'Profil güncellenirken bir hata oluştu.';
      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      setProfileError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleVerifyPendingEmail = async (code: string) => {
    if (!userProfile?.pendingEmail) return;
    try {
      const res = await apiClient.post<ApiResponse<string>>('/auth/verify-email', {
        email: userProfile.pendingEmail,
        code,
      });
      if (!res.data.isSuccess) throw new Error(res.data.message);
      clearSession();
      navigate('/login?reason=email-changed');
    } catch {
      setProfileError('E-posta doğrulanamadı. Kodu kontrol ederek tekrar deneyin.');
    }
  };

  const handleResendPendingCode = async () => {
    if (!userProfile?.pendingEmail) return;
    try {
      await apiClient.post('/auth/resend-verification-code', { email: userProfile.pendingEmail });
      setProfileSuccess('Kod isteği alındı. Yeni kod istemeden önce 1 dakika bekleyin.');
    } catch {
      setProfileError('Kod yeniden gönderilemedi. Lütfen tekrar deneyin.');
    }
  };

  const handleCancelPendingEmail = async () => {
    try {
      await apiClient.delete('/users/me/pending-email');
      setUserProfile((prev) => (prev ? { ...prev, pendingEmail: null } : null));
      setProfileSuccess('E-posta değişikliği iptal edildi.');
    } catch {
      setProfileError('E-posta değişikliği iptal edilemedi.');
    }
  };

  const handleCreateAddress = async (newAddr: {
    title: string;
    fullName: string;
    phoneNumber: string;
    city: string;
    district: string;
    detailedAddress: string;
    postalCode?: string;
    isDefault: boolean;
  }): Promise<boolean> => {
    try {
      const res = await apiClient.post<ApiResponse<AddressDto>>('/addresses', newAddr);
      if (res.data?.isSuccess) {
        await fetchAddresses();
        showSuccess('Adres başarıyla kaydedildi.');
        return true;
      }
      return false;
    } catch {
      showError('Adres kaydedilemedi.');
      return false;
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await apiClient.delete(`/addresses/${addressId}`);
      await fetchAddresses();
      showSuccess('Adres silindi.');
    } catch {
      showError('Adres silinemedi.');
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      await apiClient.put(`/addresses/${addressId}/default`);
      await fetchAddresses();
      showSuccess('Varsayılan adres güncellendi.');
    } catch {
      showError('Varsayılan adres ayarlanamadı.');
    }
  };

  const handleTabChange = (tab: 'orders' | 'favorites' | 'addresses' | 'account') => {
    setActiveTab(tab);
    navigate(`/profile?tab=${tab}`);
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <span className="hover:text-orange-600 cursor-pointer" onClick={() => navigate('/')}>
          Ana Sayfa
        </span>
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
              <span className="text-[11px] text-slate-400 font-medium truncate block">
                {userProfile?.email}
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            <button
              onClick={() => handleTabChange('orders')}
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
              onClick={() => handleTabChange('favorites')}
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
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {favorites.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('addresses')}
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
              onClick={() => handleTabChange('account')}
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
              onClick={() => void logout()}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors w-full text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Çıkış Yap</span>
            </button>
          </nav>
        </aside>

        <main className="lg:col-span-9 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs min-h-[50vh]">
          {activeTab === 'orders' && (
            <OrderHistoryTab
              orders={ordersData?.items || []}
              ordersPage={ordersPage}
              totalPages={ordersData?.totalPages || 0}
              totalCount={ordersData?.totalCount || 0}
              isLoading={isOrdersLoading}
              isError={isOrdersError}
              onPageChange={setOrdersPage}
              onRefetch={() => void refetchOrders()}
              onCancelOrder={handleCancelOrder}
              cancellingOrderId={cancellingOrderId}
            />
          )}

          {activeTab === 'favorites' && (
            <FavoritesTab
              favorites={favorites}
              favoritesCount={favoritesCount}
              favoritesPage={favoritesPage}
              favoritesPages={favoritesPages}
              isLoading={isFavoritesLoading}
              isError={isFavoritesError}
              onPageChange={setFavoritesPage}
              onRefresh={() => void refreshFavorites()}
              onToggleFavorite={toggleFavorite}
              onAddToCart={addToCart}
            />
          )}

          {activeTab === 'addresses' && (
            <AddressBookTab
              addresses={addresses}
              isLoading={isAddressesLoading}
              isError={addressesLoadError}
              onRefresh={() => void fetchAddresses()}
              onCreateAddress={handleCreateAddress}
              onDeleteAddress={handleDeleteAddress}
              onSetDefaultAddress={handleSetDefaultAddress}
              defaultFullName={userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : ''}
            />
          )}

          {activeTab === 'account' && (
            <AccountSecurityTab
              userProfile={userProfile}
              isSaving={isSavingProfile}
              profileError={profileError}
              profileSuccess={profileSuccess}
              onSaveProfile={handleSaveProfile}
              onVerifyPendingEmail={handleVerifyPendingEmail}
              onResendPendingCode={handleResendPendingCode}
              onCancelPendingEmail={handleCancelPendingEmail}
            />
          )}
        </main>
      </div>
    </div>
  );
};
