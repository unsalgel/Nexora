import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshFavorites } = useFavorites();
  const { refreshCart } = useCart();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<1 | 2>(1);
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity.trim()) return;
    setErrorMessage(null);
    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        const response = await apiClient.post('/auth/login', {
          email: identity,
          password: password
        });

        if (response.data?.isSuccess) {
          const { accessToken, refreshToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          await refreshFavorites();
          await refreshCart();

          setIsSuccess(true);
          setTimeout(() => {
            navigate('/profile');
          }, 1500);
        } else {
          setErrorMessage(response.data?.message || 'Giriş yapılamadı.');
        }
      } else {
        const parts = fullName.trim().split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || 'Gel';

        const response = await apiClient.post('/auth/register', {
          firstName,
          lastName,
          email: identity,
          password: password
        });

        if (response.data?.isSuccess) {
          setIsSuccess(true);
          setTimeout(() => {
            setActiveTab('login');
            setStep(1);
            setIdentity('');
            setPassword('');
            setFullName('');
            setIsSuccess(false);
          }, 2000);
        } else {
          setErrorMessage(response.data?.message || 'Üye olunamadı.');
        }
      }
    } catch (err: any) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors && apiErrors.length > 0) {
        setErrorMessage(apiErrors[0]);
      } else {
        setErrorMessage(err.response?.data?.message || 'Bir hata oluştu. Lütfen bilgilerinizi kontrol edip tekrar deneyin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => { setActiveTab('login'); setStep(1); setIsSuccess(false); setErrorMessage(null); }}
            className={`flex-1 py-4 text-center font-bold text-sm transition-all relative ${activeTab === 'login'
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
            onClick={() => { setActiveTab('register'); setStep(1); setIsSuccess(false); setErrorMessage(null); }}
            className={`flex-1 py-4 text-center font-bold text-sm transition-all relative ${activeTab === 'register'
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
              <span>{activeTab === 'login' ? 'Giriş başarılı! Profilinize yönlendiriliyorsunuz...' : 'Üyelik başarıyla oluşturuldu! Giriş yapabilirsiniz...'}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold animate-in fade-in-50">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5 animate-in fade-in-50">
              <form onSubmit={handleNextStep} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">E-Posta Adresi</label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-4" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. unsal@example.com"
                      value={identity}
                      onChange={(e) => setIdentity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 pt-3"
                >
                  <span>Devam Et</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in-50">
              <form onSubmit={handleFinalSubmit} className="space-y-4">
                {activeTab === 'register' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Ad Soyad</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        required
                        placeholder="Ünsal Gel"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 block">Şifre</label>
                    {activeTab === 'login' && (
                      <a href="#" className="text-[11px] font-bold text-orange-600 hover:text-orange-700 transition-colors">
                        Şifremi Unuttum
                      </a>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  <span>{isLoading ? 'Yükleniyor...' : (activeTab === 'login' ? 'Giriş Yap' : 'Kayıt Ol')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2.5 text-slate-500 hover:text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors"
              >
                Geri Dön
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium pb-6">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Kişisel verileriniz KVKK standartlarında saklanmaktadır.</span>
        </div>

      </div>
    </div>
  );
};
