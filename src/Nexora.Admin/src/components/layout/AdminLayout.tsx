import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  Tag, 
  ShoppingBag, 
  LogOut, 
  ExternalLink,
  ShieldCheck,
  Store
} from 'lucide-react';
import { decodeAdminJwt } from '../../lib/jwt';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem('adminAccessToken') || '';
  const claims = decodeAdminJwt(token);

  const handleLogout = () => {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Ürün Yönetimi', path: '/products', icon: Package },
    { name: 'Kategoriler', path: '/categories', icon: Layers },
    { name: 'Markalar', path: '/brands', icon: Tag },
    { name: 'Siparişler', path: '/orders', icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white">
      {/* SOL MENÜ (Sidebar) */}
      <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between p-4 shrink-0 shadow-sm">
        <div className="space-y-6">
          
          {/* Logo */}
          <div className="px-3 py-2 flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-1.5 group">
              <span className="logo-font text-2xl text-slate-900 font-extrabold tracking-tight">
                nexora<span className="text-orange-500 font-black">.com</span>
              </span>
            </Link>
            <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 border border-orange-200 text-[10px] font-extrabold uppercase tracking-wider">
              Admin
            </span>
          </div>

          {/* Menü Linkleri */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Alt Bilgi & Çıkış */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-orange-600 hover:bg-orange-50/60 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Store className="w-3.5 h-3.5" /> Mağazayı Gör
            </span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm shadow-orange-500/20">
                {claims?.firstName ? claims.firstName[0].toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {claims ? `${claims.firstName} ${claims.lastName}` : 'Yönetici'}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Çıkış Yap"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* SAĞ İÇERİK ALANI */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50/60">
        <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
