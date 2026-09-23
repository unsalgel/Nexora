import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, KeyRound, X, Sparkles } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { AxiosError } from 'axios';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshFavorites } = useFavorites();
  const { refreshCart } = useCart();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.trim().length !== 6) {
      setErrorMessage('Lütfen 6 haneli doğrulama kodunu eksiksiz giriniz.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/verify-email', {
        email: identity.trim(),
        code: verificationCode.trim()
      });

      if (response.data?.isSuccess) {
        setIsSuccess(true);
        setTimeout(() => {
          setActiveTab('login');
          setStep(2);
          setVerificationCode('');
          setIsSuccess(false);
        }, 1800);
      } else {
        setErrorMessage(response.data?.message || 'Doğrulama başarısız oldu.');
      }
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string; errors?: string[] }>;
      const apiErrors = error.response?.data?.errors;
      if (apiErrors && apiErrors.length > 0) {
        setErrorMessage(apiErrors[0]);
      } else {
        setErrorMessage(error.response?.data?.message || 'Doğrulama kodu hatalı veya süresi dolmuş.');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
          const { accessToken, refreshToken, failedLoginAttempts, failedAttemptDetails } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);

          if (failedLoginAttempts && failedLoginAttempts > 0) {
            sessionStorage.setItem('pendingSecurityNotice', JSON.stringify({
              failedCount: failedLoginAttempts,
              details: failedAttemptDetails || []
            }));
          }
          
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
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string; errors?: string[] }>;
      const apiErrors = error.response?.data?.errors;
      if (apiErrors && apiErrors.length > 0) {
        setErrorMessage(apiErrors[0]);
      } else {
        setErrorMessage(error.response?.data?.message || 'Bir hata oluştu. Lütfen bilgilerinizi kontrol edip tekrar deneyin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotError(null);
    setForgotSuccess(null);
    setForgotLoading(true);

    try {
      const res = await apiClient.post('/auth/forgot-password', { email: forgotEmail.trim() });
      if (res.data?.isSuccess) {
        setForgotSuccess(res.data?.message || 'Sıfırlama kodu gönderildi.');
        setForgotStep(2);
      } else {
        setForgotError(res.data?.message || 'Kod gönderilemedi.');
      }
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string; errors?: string[] }>;
      setForgotError(error.response?.data?.message || 'Şifre sıfırlama kodu gönderilirken hata oluştu.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim() || !newPassword.trim()) return;
    setForgotError(null);
    setForgotSuccess(null);
    setForgotLoading(true);

    try {
      const res = await apiClient.post('/auth/reset-password', {
        email: forgotEmail.trim(),
        code: resetCode.trim(),
        newPassword: newPassword
      });

      if (res.data?.isSuccess) {
        setForgotSuccess('Şifreniz başarıyla sıfırlandı! Artık yeni şifrenizle giriş yapabilirsiniz.');
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotStep(1);
          setResetCode('');
          setNewPassword('');
          setForgotSuccess(null);
          setIdentity(forgotEmail);
          setStep(2);
        }, 2000);
      } else {
        setForgotError(res.data?.message || 'Şifre sıfırlanamadı.');
      }
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string; errors?: string[] }>;
      const apiErrors = error.response?.data?.errors;
      if (apiErrors && apiErrors.length > 0) {
        setForgotError(apiErrors[0]);
      } else {
        setForgotError(error.response?.data?.message || 'Şifre güncellenirken bir hata oluştu.');
      }
    } finally {
      setForgotLoading(false);
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
              <span>{activeTab === 'login' ? 'Giriş başarılı! Profilinize yönlendiriliyorsunuz...' : step === 3 ? 'E-postanız doğrulandı! Giriş ekranına geçiliyor...' : 'Üyelik oluşturuldu!'}</span>
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
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(identity);
                          setForgotStep(1);
                          setForgotError(null);
                          setForgotSuccess(null);
                          setShowForgotModal(true);
                        }}
                        className="text-[11px] font-bold text-orange-600 hover:text-orange-700 transition-colors"
                      >
                        Şifremi Unuttum
                      </button>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrorMessage(null); }}
                      className={`w-full bg-slate-50 border rounded-xl pl-11 pr-11 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 transition-all ${
                        errorMessage 
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15' 
                          : 'border-slate-200 focus:border-orange-500 focus:ring-orange-500/15'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errorMessage && (
                    <div className="flex items-center gap-1.5 pt-1 text-rose-600 text-xs font-semibold animate-in fade-in-50">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
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

          {step === 3 && (
            <div className="space-y-5 animate-in fade-in-50">
              <div className="p-3.5 bg-orange-50 border border-orange-200/80 rounded-2xl text-xs text-orange-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-orange-600" />
                  E-Posta Doğrulama Kodu Gönderildi
                </p>
                <p className="text-slate-600">
                  <strong className="text-slate-800">{identity}</strong> adresinize gönderilen 6 haneli kodu giriniz.
                </p>
              </div>

              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">6 Haneli Doğrulama Kodu</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => {
                      setVerificationCode(e.target.value.replace(/\D/g, ''));
                      setErrorMessage(null);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-center tracking-widest text-xl font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-all"
                  />
                </div>

                {errorMessage && (
                  <div className="flex items-center gap-1.5 pt-1 text-rose-600 text-xs font-semibold animate-in fade-in-50">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  <span>{isLoading ? 'Doğrulanıyor...' : 'Hesabı Onayla ve Giriş Yap'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep(2); setErrorMessage(null); }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Geri Dön
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium pb-6">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Kişisel verileriniz KVKK standartlarında saklanmaktadır.</span>
        </div>

      </div>

      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="relative bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-6 text-white text-center">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute right-4 top-4 p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 mx-auto bg-white/20 rounded-2xl flex items-center justify-center mb-3 shadow-inner backdrop-blur-md">
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-black tracking-tight">Şifremi Unuttum</h3>
              <p className="text-xs text-orange-100 font-medium mt-1">
                {forgotStep === 1 
                  ? 'E-posta adresinize 6 haneli doğrulama kodu göndereceğiz.' 
                  : 'E-postanıza gelen doğrulama kodunu ve yeni şifrenizi girin.'}
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              {forgotSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {forgotError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotStep === 1 ? (
                <form onSubmit={handleSendResetCode} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Kayıtlı E-Posta Adresi</label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-4" />
                      <input
                        type="email"
                        required
                        placeholder="ornek@domain.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <span>{forgotLoading ? 'Kod Gönderiliyor...' : 'Doğrulama Kodu Gönder'}</span>
                    <Sparkles className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">6 Haneli Doğrulama Kodu</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="123456"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center tracking-widest text-lg font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Yeni Şifre</label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-4" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        placeholder="En az 6 karakter"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-11 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <span>{forgotLoading ? 'Şifre Yenileniyor...' : 'Şifremi Sıfırla ve Kaydet'}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="w-full py-2 text-slate-500 hover:text-slate-700 font-semibold text-xs"
                  >
                    Kodu Tekrar Gönder
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

