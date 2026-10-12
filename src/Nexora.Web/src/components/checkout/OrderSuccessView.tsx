import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

interface OrderSuccessViewProps {
  orderNumber: string;
}

export const OrderSuccessView: React.FC<OrderSuccessViewProps> = ({ orderNumber }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4 py-12">
      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-2">
        <CheckCircle2 className="w-12 h-12" />
      </div>
      <h1 className="text-2xl font-black text-slate-900">Siparişiniz Başarıyla Alındı!</h1>
      <p className="text-sm text-slate-500 max-w-md">
        Sipariş numaranız <strong className="text-slate-800 font-mono font-bold">#{orderNumber}</strong>. Siparişinizin detaylarını profilinizdeki <strong>Siparişlerim</strong> sekmesinden canlı takip edebilirsiniz.
      </p>
      <div className="pt-6 flex gap-4">
        <Link
          to="/orders"
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
        >
          Siparişlerimi Görüntüle
        </Link>
        <Link
          to="/"
          className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
        >
          Alışverişe Devam Et
        </Link>
      </div>
    </div>
  );
};
