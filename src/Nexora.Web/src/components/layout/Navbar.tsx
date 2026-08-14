import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { decodeJwt } from '../../lib/jwt';
import { 
  ShoppingBag, 
  Heart, 
  User, 
  Search, 
  Menu, 
  X, 
  PhoneCall, 
  Truck, 
  Layers,
  Sparkles,

} from 'lucide-react';

export const Navbar: React.FC = () => {

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const [userName, setUserName] = useState<string | null>(null);

  const categories = [
    'Elektronik',
    'Moda & Giyim',
    'Ev, Yaşam & Mobilya',
    'Kozmetik & Kişisel Bakım',
    'Spor & Outdoor',
    'Anne, Bebek & Oyuncak',
    'Süpermarket',
    'Kitap & Kırtasiye'
  ];

  const isLoggedIn = !!localStorage.getItem('accessToken');

  useEffect(() => {
    if (isLoggedIn) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const claims = decodeJwt(token);
        if (claims) {
          setUserName(`${claims.firstName} ${claims.lastName}`);
        }
      }
    } else {
      setUserName(null);
    }
  }, [isLoggedIn]);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm w-full overflow-hidden">
      
      {/* 1. Üst Duyuru Barı */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Truck className="w-3.5 h-3.5 text-orange-400" />
              150 TL ve Üzeri Alışverişlerde Kargo Ücretsiz!
            </span>
            <span className="text-slate-700">|</span>
            <span className="hover:text-white cursor-pointer transition-colors font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Bugüne Özel Fırsat Ürünleri
            </span>
          </div>
          <div className="flex items-center gap-5 text-slate-400 font-medium">
            <span className="hover:text-white cursor-pointer flex items-center gap-1">
              <PhoneCall className="w-3 h-3 text-orange-400" /> Müşteri Hizmetleri: 0850 123 45 67
            </span>
            <Link to="/orders" className="hover:text-white transition-colors">Sipariş Takibi</Link>
          </div>
        </div>
      </div>

      {/* 2. Ana Header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        <div className="flex items-center justify-between gap-2 sm:gap-6">
          
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0 group py-1">
            <span className="logo-font text-2xl sm:text-[32px] text-slate-900 group-hover:opacity-90 transition-opacity leading-none">
              nexora<span className="text-orange-500 font-black">.com</span>
            </span>
          </Link>

          {/* Masaüstü Arama Motoru */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Aradığınız ürün, marka veya kategoriyi yazınız..."
                className="w-full bg-slate-100/90 border border-slate-200 rounded-full pl-5 pr-14 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-all shadow-inner"
              />
              <button 
                type="button"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center shadow-md shadow-orange-500/20"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sağ Eylem Butonları */}
          <div className="flex items-center gap-1 sm:gap-3">
            
            {/* Giriş Yap / Profilim */}
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
                    <span className="text-xs font-bold text-slate-800">veya Üye Ol</span>
                  </>
                )}
              </div>
            </Link>

            {/* Favorilerim */}
            <Link
              to="/favorites"
              className="p-2 sm:px-3 text-slate-700 hover:text-rose-600 hover:bg-rose-50/70 rounded-xl transition-colors font-medium text-sm flex items-center gap-1"
            >
              <Heart className="w-5 h-5 text-slate-600" />
              <span className="hidden lg:inline text-xs font-bold">Favorilerim</span>
            </Link>

            {/* Sepetim */}
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

            {/* Mobil Menü Butonu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobil Arama Motoru */}
        <div className="mt-2 sm:mt-3 md:hidden w-full">
          <div className="relative flex items-center w-full">
            <input
              type="text"
              placeholder="Ürün, marka veya kategori ara..."
              className="w-full bg-slate-100 border border-slate-200 rounded-full pl-4 pr-10 py-2 text-xs text-slate-900"
            />
            <button className="absolute right-1 top-1 bottom-1 px-3 bg-orange-500 text-white rounded-full flex items-center justify-center">
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Yatay Kategori Barı */}
      <div className="bg-white border-t border-slate-100 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center justify-between text-xs font-semibold text-slate-700 overflow-x-auto py-2.5 gap-6">
            <li className="flex items-center gap-1.5 text-orange-600 hover:text-orange-700 cursor-pointer shrink-0 font-bold">
              <Layers className="w-4 h-4" />
              Tüm Kategoriler
            </li>
            {categories.map((cat, idx) => (
              <li key={idx} className="hover:text-orange-600 cursor-pointer whitespace-nowrap transition-colors">
                {cat}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Mobil Menü */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-3 shadow-lg">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kategoriler</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {categories.map((cat, idx) => (
              <Link
                key={idx}
                to="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 bg-slate-50 rounded-lg text-slate-700 hover:bg-orange-50 hover:text-orange-600 font-medium text-xs"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
