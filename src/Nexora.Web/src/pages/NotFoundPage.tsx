import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ShoppingBag } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-100 border border-slate-200/80 text-slate-800 font-mono text-2xl font-black shadow-xs">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl">
            Sayfa Bulunamadı
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Aradığınız sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir. Lütfen bağlantıyı kontrol edin veya ana sayfaya dönün.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Ana Sayfa</span>
          </Link>
          <Link
            to="/products"
            className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-slate-500" />
            <span>Kataloğu İncele</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
