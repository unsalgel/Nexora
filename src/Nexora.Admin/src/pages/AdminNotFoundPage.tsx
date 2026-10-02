import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';

export const AdminNotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-5 bg-white p-8 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 font-mono text-xl font-black">
          404
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Panel Sayfası Bulunamadı</h2>
          <p className="text-xs text-slate-500 font-medium">
            Aradığınız yönetim paneli sayfası mevcut değil veya taşınmış olabilir.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Kontrol Paneline Dön</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
