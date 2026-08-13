import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<1 | 2>(1);
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity.trim()) return;
    setStep(2);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        
        {/* Tab Sekmeleri */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => { setActiveTab('login'); setStep(1); setIsSuccess(false); }}
            className={`flex-1 py-4 text-center font-bold text-sm transition-all relative ${
              activeTab === 'login'
                ? 'text-orange-600 bg-white'
                : 'text-slate-500 bg-slate-50 hover:bg-slate-100/80'
            }`}
          >
            Giriş Yap
            {activeTab === 'login' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
            )}
          </button>

          <button
            onClick={() => { setActiveTab('register'); setStep(1); setIsSuccess(false); }}
            className={`flex-1 py-4 text-center font-bold text-sm transition-all relative ${
              activeTab === 'register'
                ? 'text-orange-600 bg-white'
                : 'text-slate-500 bg-slate-50 hover:bg-slate-100/80'
            }`}
          >
            Üye Ol
            {activeTab === 'register' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
            )}
          </button>
        </div>

        <div className="p-8 sm:p-10 space-y-6">

          {isSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 text-xs font-semibold animate-in fade-in-50">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span>{activeTab === 'login' ? 'Giriş başarılı!' : 'Üyelik oluşturuldu!'} Yönlendiriliyorsunuz...</span>
            </div>
          )}

          {/* ADIM 1: E-posta Adresi veya GSM Numarası Girme */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in-50">
              <form onSubmit={handleNextStep} className="space-y-4">
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4" />
                  <input
                    type="text"
                    required
                    value={identity}
                    onChange={(e) => setIdentity(e.target.value)}
                    placeholder="E-posta adresi veya GSM numarası"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <span>Devam Et</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Kişisel verileriniz, <a href="#" className="font-bold text-slate-600 underline">Aydınlatma Metni</a> kapsamında işlenmektedir. 
                "Devam et" butonuna basarak <a href="#" className="font-bold text-slate-600 underline">Üyelik Sözleşmesi</a>'ni okuduğunuzu ve kabul ettiğinizi onaylıyorsunuz.
              </p>
            </div>
          )}

          {/* ADIM 2: Şifre / Ek Bilgi Girme */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in-50">
              <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 truncate">{identity}</span>
                <button
                  onClick={() => setStep(1)}
                  className="text-orange-600 font-bold hover:underline shrink-0 ml-2"
                >
                  Değiştir
                </button>
              </div>

              <form onSubmit={handleFinalSubmit} className="space-y-4">
                {activeTab === 'register' && (
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ad Soyad"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-all"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Şifre"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-11 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {activeTab === 'login' && (
                    <div className="flex justify-end pt-0.5">
                      <a href="#" className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors">
                        Şifremi Unuttum?
                      </a>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <span>{activeTab === 'login' ? 'Giriş Yap' : 'Tamamla ve Üye Ol'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Alt Sosyal Hesabın ile Giriş Yap Alanı (Hepsiburada Tarzı) */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <p className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider">
              Sosyal hesabın ile giriş yap
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                title="Apple ile Giriş Yap"
                className="w-12 h-12 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95"
              >
                <svg className="w-5 h-5 fill-slate-900" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.35c.64-.78 1.08-1.85.96-2.93-.93.04-2.07.62-2.74 1.4-.6.69-1.12 1.79-.98 2.85 1.05.08 2.12-.54 2.76-1.32z"/>
                </svg>
              </button>

              <button
                type="button"
                title="Google ile Giriş Yap"
                className="w-12 h-12 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.3 7.31 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
              </button>

              <button
                type="button"
                title="Facebook ile Giriş Yap"
                className="w-12 h-12 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95"
              >
                <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Kişisel verileriniz KVKK standartlarında saklanmaktadır.</span>
          </div>

        </div>
      </div>
    </div>
  );
};
