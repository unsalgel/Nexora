import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
          <h2 className="text-2xl font-black text-slate-900 tracking-tight pt-2">Hoş Geldiniz!</h2>
          <p className="text-xs text-slate-500 font-medium">Hesabınıza giriş yaparak alışverişe devam edin.</p>
        </div>

        {isSubmitted && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 text-xs font-semibold animate-in fade-in-50">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>Giriş başarılı! Yönlendiriliyorsunuz...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-1.5">
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifre"
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
            <div className="flex justify-end pt-0.5">
              <a href="#" className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors">
                Şifremi Unuttum?
              </a>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
              />
              <span className="text-xs font-medium text-slate-600">Beni Hatırla</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 pt-3"
          >
            <span>Giriş Yap</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">veya</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
          >
            <span>Google ile Giriş</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
          >
            <span>Apple ile Giriş</span>
          </button>
        </div>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-medium">
            Henüz bir hesabınız yok mu?{' '}
            <Link to="/register" className="font-bold text-orange-600 hover:text-orange-700 transition-colors">
              Hemen Kayıt Olun
            </Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Bilgileriniz 256-Bit SSL ile korunmaktadır.</span>
        </div>

      </div>
    </div>
  );
};
