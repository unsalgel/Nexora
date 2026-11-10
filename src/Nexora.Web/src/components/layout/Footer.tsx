import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';

export const Footer: React.FC = () => {
  const { settings } = useSettings();
  const linkClassName = 'transition-colors hover:text-orange-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600';

  return (
    <footer className="mt-12 border-t border-slate-200 bg-white text-sm text-slate-600">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <Link to="/" className="text-xl font-bold tracking-tight text-slate-900">nexora<span className="text-orange-500">.com</span></Link>
          <p className="mt-3 leading-6 text-slate-500">Ürünleri inceleyin ve alışverişinizi tamamlayın.</p>
        </div>
        <nav aria-label="Alt menü alışveriş bağlantıları">
          <h2 className="mb-4 font-semibold text-slate-900">Alışveriş</h2>
          <ul className="space-y-3">
            <li><Link to="/products" className={linkClassName}>Tüm Ürünler</Link></li>
            <li><Link to="/favorites" className={linkClassName}>Favorilerim</Link></li>
            <li><Link to="/orders" className={linkClassName}>Siparişlerim</Link></li>
            <li><Link to="/profile" className={linkClassName}>Hesabım</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="mb-4 font-semibold text-slate-900">Teslimat ve Ödeme</h2>
          <p className="leading-6">{settings.freeShippingThreshold.toLocaleString('tr-TR')} TL ve üzeri alışverişlerde ücretsiz kargo.</p>
          <p className="mt-3 leading-6 text-slate-500">Ödeme işlemleri iyzico üzerinden gerçekleştirilir.</p>
        </div>
        <div>
          <h2 className="mb-4 font-semibold text-slate-900">İletişim</h2>
          <p className="mb-3 leading-6 text-slate-500">Sipariş, teslimat ve iade sorularınız için bize ulaşın.</p>
          {settings.contactEmail && <a href={`mailto:${settings.contactEmail}`} className={`${linkClassName} block break-words`}>{settings.contactEmail}</a>}
          {settings.contactPhone && <a href={`tel:${settings.contactPhone.replace(/[^+\d]/g, '')}`} className={`${linkClassName} mt-3 block`}>{settings.contactPhone}</a>}
        </div>
      </div>
      <div className="border-t border-slate-100 px-4 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Nexora. Tüm hakları saklıdır.
      </div>
    </footer>
  );
};
