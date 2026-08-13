import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage('Şifreler eşleşmiyor!');
      return;
    }
    setErrorMessage('');
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 sm:p-10 space-y-6">
        
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <span className="text-3xl font-black tracking-tight text-slate-900 leading-none">
              nexora<span className="text-orange-500">.com</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight pt-2">Aramıza Katılın!</h2>
          <p className="text-xs text-slate-500 font-medium">Sadece 1 dakikada üye olup özel indirimlerden yararlanın.</p>
        </div>

        {isSubmitted && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 text-xs font-semibold animate-in fade-in-50">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>Hesabınız başarıyla oluşturuldu! Giriş sayfasına yönlendiriliyorsunuz...</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="relative flex items-center">
            <User className="w-4 h-4 text-slate-400 absolute left-4" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ad Soyad"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-all"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-all"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-11 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-all"
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
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 pt-3"
          >
            <span>Üye Ol</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

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
