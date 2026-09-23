import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, KeyRound, ArrowLeft } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { AxiosError } from 'axios';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [verificationCode, setVerificationCode] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (password !== confirmPassword) {
      setErrorMessage('Şifreler eşleşmiyor!');
      return;
    }

    setIsLoading(true);

    try {
      const parts = fullName.trim().split(' ');
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      const response = await apiClient.post('/auth/register', {
        firstName,
        lastName: lastName || 'Üye',
        email,
        password
      });

      if (response.data?.isSuccess) {
        setStep('verify');
        setSuccessMessage('Kayıt oluşturuldu! E-posta adresinize gönderilen 6 haneli doğrulama kodunu giriniz.');
      } else {
        setErrorMessage(response.data?.message || 'Üyelik oluşturulamadı.');
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

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (verificationCode.trim().length !== 6) {
      setErrorMessage('Lütfen 6 haneli doğrulama kodunu eksiksiz giriniz.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/verify-email', {
        email,
        code: verificationCode.trim()
      });

      if (response.data?.isSuccess) {
        setIsSuccess(true);
        setSuccessMessage('E-posta adresiniz başarıyla doğrulandı! Giriş sayfasına yönlendiriliyorsunuz...');
        setTimeout(() => {
          navigate('/login');
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

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 sm:p-10 space-y-6">
        
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <span className="logo-font text-2xl tracking-tight text-slate-900 leading-none">
              nexora<span className="text-orange-500">.com</span>
            </span>
          </Link>

          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {step === 'register' ? 'Aramıza Katılın!' : 'E-Postanızı Doğrulayın'}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {step === 'register' 
                ? 'Sadece 1 dakikada üye olup özel indirimlerden yararlanın.' 
                : `${email} adresine gönderilen 6 haneli kodu giriniz.`}
            </p>
          </div>
        </div>

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 text-xs font-semibold animate-in fade-in-50">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold animate-in fade-in-50">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {step === 'register' ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute left-4" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ad Soyad"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-all"
              />
            </div>

            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-4" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-Posta Adresi"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-all"
              />
            </div>

            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifre (En az 6 karakter)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-11 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Şifre Tekrarı"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-all"
              />
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 mt-0.5"
                />
                <span className="text-xs text-slate-600 leading-tight">
                  <a href="#" className="font-bold text-orange-600 underline">Kullanım Koşulları</a> ve <a href="#" className="font-bold text-orange-600 underline">Gizlilik Politikası</a>'nı okudum, kabul ediyorum.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? 'Yükleniyor...' : 'Üye Ol'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div className="relative flex items-center">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-4" />
              <input
                type="text"
                required
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="6 Haneli Doğrulama Kodu"
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-center font-mono tracking-[0.3em] text-lg font-bold text-slate-900 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? 'Doğrulanıyor...' : 'E-Postayı Doğrula'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('register');
                setErrorMessage('');
              }}
              className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Bilgileri Düzenle</span>
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-medium">
            Zaten bir hesabınız var mı?{' '}
            <Link to="/login" className="font-bold text-orange-600 hover:text-orange-700 transition-colors">
              Giriş Yapın
            </Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Kişisel verileriniz KVKK standartlarında saklanmaktadır.</span>
        </div>

      </div>
    </div>
  );
};
