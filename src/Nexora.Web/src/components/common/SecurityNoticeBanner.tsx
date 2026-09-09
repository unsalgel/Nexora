import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface FailedAttemptDetail {
  attemptedAtUtc: string;
  ipAddress?: string;
}

interface SecurityNoticeData {
  failedCount: number;
  details?: FailedAttemptDetail[];
}

export const SecurityNoticeBanner: React.FC = () => {
  const location = useLocation();
  const [notice, setNotice] = useState<SecurityNoticeData | null>(null);

  useEffect(() => {
    // Sadece oturum açılmış sayfalarda (login & register harici) göster
    if (location.pathname !== '/login' && location.pathname !== '/register') {
      const stored = sessionStorage.getItem('pendingSecurityNotice');
      if (stored) {
        try {
          setNotice(JSON.parse(stored));
        } catch {
          setNotice(null);
        }
      }
    }
  }, [location.pathname]);

  if (!notice) return null;

  const handleDismiss = () => {
    sessionStorage.removeItem('pendingSecurityNotice');
    setNotice(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200/80 p-6 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Clean Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
              Güvenlik Uyarısı
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Önceki oturumda başarısız giriş denemeleri kaydedildi.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-600 p-1 -mr-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice text */}
        <p className="text-xs text-slate-600 leading-relaxed">
          Hesabınıza erişim sağlanmadan önce <span className="font-semibold text-slate-900">{notice.failedCount} kez</span> hatalı parola girilmiştir:
        </p>

        {/* Minimalist Log Table */}
        {notice.details && notice.details.length > 0 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
            <div className="bg-slate-50 px-3.5 py-2 flex justify-between font-medium text-[11px] text-slate-400 uppercase tracking-wider">
              <span>Tarih & Saat</span>
              <span>IP Adresi</span>
            </div>
            {notice.details.slice(0, 5).map((item, idx) => (
              <div key={idx} className="px-3.5 py-2.5 flex items-center justify-between text-slate-700">
                <span className="font-medium text-[11.5px]">
                  {new Date(item.attemptedAtUtc).toLocaleString('tr-TR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  {item.ipAddress === '::1' || !item.ipAddress ? '127.0.0.1 (Yerel)' : item.ipAddress}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="text-[11.5px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
          Bu denemeler bilginiz dahilinde değilse, lütfen hesap şifrenizi güncelleyiniz.
        </div>

        <div className="flex gap-2.5 pt-1">
          <button
            onClick={handleDismiss}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
          >
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
};
