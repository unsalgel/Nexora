import React from 'react';
import { Truck, ShieldCheck, RotateCcw, Headset, CreditCard } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-16 text-slate-600">
      
      {/* Güven Rozetleri */}
      <div className="border-b border-slate-200 bg-slate-50/70 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100/80 text-orange-600 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Ücretsiz & Hızlı Kargo</h4>
              <p className="text-xs text-slate-500">150 TL üzeri kargo bedava</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100/80 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">%100 Güvenli Ödeme</h4>
              <p className="text-xs text-slate-500">256-Bit SSL Koruma</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100/80 text-blue-600 rounded-xl">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Kolay İade Garantisi</h4>
              <p className="text-xs text-slate-500">14 Gün İçinde Koşulsuz İade</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100/80 text-amber-600 rounded-xl">
              <Headset className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">7/24 Canlı Destek</h4>
              <p className="text-xs text-slate-500">Her zaman yanınızdayız</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Linkleri */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <h5 className="font-bold text-slate-900 mb-4">Nexora Kurumsal</h5>
          <ul className="space-y-2 text-xs">
            <li><a href="#" className="hover:text-orange-600">Hakkımızda</a></li>
            <li><a href="#" className="hover:text-orange-600">Kariyer</a></li>
            <li><a href="#" className="hover:text-orange-600">İletişim</a></li>
            <li><a href="#" className="hover:text-orange-600">Sürdürülebilirlik</a></li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-slate-900 mb-4">Müşteri Hizmetleri</h5>
          <ul className="space-y-2 text-xs">
            <li><a href="#" className="hover:text-orange-600">Canlı Yardım</a></li>
            <li><a href="#" className="hover:text-orange-600">Sıkça Sorulan Sorular</a></li>
            <li><a href="#" className="hover:text-orange-600">Kargo Takip</a></li>
            <li><a href="#" className="hover:text-orange-600">İade ve Değişim</a></li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-slate-900 mb-4">Popüler Kategoriler</h5>
          <ul className="space-y-2 text-xs">
            <li><a href="#" className="hover:text-orange-600">Akıllı Telefonlar</a></li>
            <li><a href="#" className="hover:text-orange-600">Laptop & Bilgisayar</a></li>
            <li><a href="#" className="hover:text-orange-600">Kadın / Erkek Giyim</a></li>
            <li><a href="#" className="hover:text-orange-600">Spor Ayakkabı</a></li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-slate-900 mb-4">Ödeme Yöntemleri</h5>
          <p className="text-xs text-slate-500 mb-3">Tüm kredi kartlarına taksit imkanı</p>
          <div className="flex gap-2 text-slate-400">
            <CreditCard className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 py-6 bg-slate-50 text-xs text-center text-slate-500">
        © 2026 Nexora E-Ticaret Platformu. Tüm hakları saklıdır.
      </div>
    </footer>
  );
};
