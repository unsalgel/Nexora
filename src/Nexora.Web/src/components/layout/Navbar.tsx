import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import { decodeJwt } from '../../lib/jwt';
import { apiClient } from '../../lib/apiClient';
import type { ApiResponse } from '../../lib/apiClient';
import { useQuery } from '@tanstack/react-query';
import { NotificationDropdown } from './NotificationDropdown';
import { 
  Search, 
  ShoppingBag, 
  User, 
  Heart, 
  Bell,
  Menu, 
  X, 
  Layers, 
  PhoneCall, 
  Sparkles,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { cartCount } = useCart();
  const { unreadCount, isOpen: isNotificationOpen, setIsOpen: setIsNotificationOpen } = useNotifications();
  const navigate = useNavigate();
  const categoryScrollRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { data: categoriesData } = useQuery<ApiResponse<{ id: string; name: string }[]>>({
    queryKey: ['navbar-categories'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<{ id: string; name: string }[]>>('/categories');
      return res.data;
    },
    staleTime: 1000 * 60 * 10
  });

  const categories = categoriesData?.data || [];

  const token = localStorage.getItem('accessToken');
  const isLoggedIn = !!token;
  let userName = '';

  if (token) {
    const claims = decodeJwt(token);
    if (claims && claims.firstName) {
      userName = `${claims.firstName} ${claims.lastName || ''}`.trim();
    }
  }

  const checkScrollability = () => {
    const el = categoryScrollRef.current;
    if (el) {
      const hasOverflow = el.scrollWidth > el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 5);
      setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, []);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScrollability, 300);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/products?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/products');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs font-sans">
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center font-medium">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-orange-400 font-semibold">
              <Sparkles className="w-3 h-3" /> 150 TL ve Üzeri Alışverişlerde Kargo Ücretsiz!
            </span>
            <span className="text-slate-500">|</span>
            <Link to="/products" className="hover:text-white transition-colors flex items-center gap-1 text-slate-300">
              <span className="text-amber-400">🔥</span> Bugüne Özel Fırsat Ürünleri
            </Link>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <PhoneCall className="w-3 h-3 text-orange-400" /> Müşteri Hizmetleri: 0850 123 45 67
            </span>
            <Link to="/orders" className="hover:text-white transition-colors">Sipariş Takibi</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        <div className="flex items-center justify-between gap-2 sm:gap-6">
          <Link to="/" className="flex items-center shrink-0 group py-1">
            <span className="logo-font text-2xl sm:text-[32px] text-slate-900 group-hover:opacity-90 transition-opacity leading-none">
              nexora<span className="text-orange-500 font-black">.com</span>
            </span>
          </Link>

          <div className="flex-1 max-w-2xl hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Aradığınız ürün, marka veya kategoriyi yazınız..."
                className="w-full bg-slate-100/90 border border-slate-200 rounded-full pl-5 pr-14 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-all shadow-inner"
              />
              <button 
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center shadow-md shadow-orange-500/20 hover:opacity-90 transition-opacity cursor-pointer"
                title="Ara"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              to={isLoggedIn ? "/profile" : "/login"}
              className="p-2 sm:px-3 text-slate-700 hover:text-orange-600 hover:bg-orange-50/70 rounded-xl transition-colors font-medium text-sm flex items-center gap-1.5"
            >
              <User className="w-5 h-5 text-slate-600" />
              <div className="hidden lg:flex flex-col text-left leading-tight">
                {isLoggedIn ? (
                  <>
                    <span className="text-[11px] text-slate-400 font-normal">Hesabım</span>
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[100px]">{userName || 'Kullanıcı'}</span>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] text-slate-400 font-normal">Giriş Yap</span>
                    <span className="text-xs font-bold text-slate-800">veye Üye Ol</span>
                  </>
                )}
              </div>
            </Link>

            {isLoggedIn && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className={`p-2 sm:px-3 rounded-xl transition-colors font-medium text-sm flex items-center gap-1.5 cursor-pointer ${
                    isNotificationOpen 
                      ? 'text-orange-600 bg-orange-50' 
                      : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50/70'
                  }`}
                  title="Bildirimler"
                >
                  <div className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="hidden lg:inline text-xs font-bold">Bildirimler</span>
                </button>

                <NotificationDropdown />
              </div>
            )}

            <Link
              to="/favorites"
              className="p-2 sm:px-3 text-slate-700 hover:text-rose-600 hover:bg-rose-50/70 rounded-xl transition-colors font-medium text-sm flex items-center gap-1"
            >
              <Heart className="w-5 h-5 text-slate-600" />
              <span className="hidden lg:inline text-xs font-bold">Favorilerim</span>
            </Link>

            <Link
              to="/cart"
              className="p-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl shadow-md shadow-orange-500/20 font-bold text-sm flex items-center gap-2"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 bg-slate-900 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              </div>
              <span className="hidden sm:inline">Sepetim</span>
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <div className="mt-2 sm:mt-3 md:hidden w-full">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ürün, marka veya kategori ara..."
              className="w-full bg-slate-100 border border-slate-200 rounded-full pl-4 pr-10 py-2 text-xs text-slate-900"
            />
            <button 
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-3 bg-orange-500 text-white rounded-full flex items-center justify-center"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white border-t border-slate-100 hidden md:block relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative flex items-center">
          {canScrollLeft && (
            <button
              onClick={() => scrollCategories('left')}
              className="p-1 text-slate-400 hover:text-orange-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer mr-1 shrink-0 animate-in fade-in"
              title="Sola Kaydır"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          <ul
            ref={categoryScrollRef}
            onScroll={checkScrollability}
            className="flex items-center text-xs font-semibold text-slate-700 overflow-x-auto py-2.5 gap-6 no-scrollbar flex-1 scroll-smooth justify-between"
          >
            <li
              onClick={() => navigate('/products')}
              className="flex items-center gap-1.5 text-orange-600 hover:text-orange-700 cursor-pointer shrink-0 font-bold"
            >
              <Layers className="w-4 h-4" />
              Tüm Kategoriler
            </li>
            {categories.map((cat) => (
              <li
                key={cat.id}
                onClick={() => navigate(`/products?categoryId=${cat.id}`)}
                className="hover:text-orange-600 cursor-pointer whitespace-nowrap transition-colors shrink-0"
              >
                {cat.name}
              </li>
            ))}
          </ul>

          {canScrollRight && (
            <button
              onClick={() => scrollCategories('right')}
              className="p-1 text-slate-400 hover:text-orange-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer ml-1 shrink-0 animate-in fade-in"
              title="Sağa Kaydır"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-3 shadow-lg">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kategoriler</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?categoryId=${cat.id}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 bg-slate-50 rounded-lg text-slate-700 hover:bg-orange-50 hover:text-orange-600 font-medium text-xs truncate"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
