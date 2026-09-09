import React, { useState, useEffect } from 'react';
import { ShieldAlert, Check, X, Clock, Globe } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in-50 duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            Güvenlik Bilgilendirmesi
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Son başarılı girişinizden önce hesabınıza <strong className="font-bold text-slate-900">{notice.failedCount} adet</strong> hatalı şifre denemesi gerçekleştirildi:
          </p>
        </div>

        {notice.details && notice.details.length > 0 && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 max-h-48 overflow-y-auto space-y-2 divide-y divide-slate-100">
            {notice.details.map((item, idx) => (
              <div key={idx} className={`flex items-center justify-between text-[11px] ${idx > 0 ? 'pt-2' : ''}`}>
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(item.attemptedAtUtc).toLocaleString('tr-TR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 font-semibold">
                  <Globe className="w-3 h-3 text-amber-500" />
                  <span>{item.ipAddress === '::1' || !item.ipAddress ? '127.0.0.1 (Yerel)' : item.ipAddress}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-slate-500 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-100">
          Bu denemeler size ait değilse, güvenliğiniz için şifrenizi hemen profilinizden güncellemenizi tavsiye ederiz.
        </p>

        <button
          onClick={handleDismiss}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Bilgilendirildim, Anladım</span>
        </button>
      </div>
    </div>
  );
};
