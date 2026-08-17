import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight, KeyRound, ShieldCheck } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { decodeAdminJwt } from '../lib/jwt';
import type { ApiResponse } from '../lib/apiClient';

interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
}

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', {
        email,
        password
      });

      if (response.data?.isSuccess && response.data.data) {
        const { accessToken, refreshToken } = response.data.data;
        const claims = decodeAdminJwt(accessToken);

        if (claims?.roles.includes('Admin')) {
          localStorage.setItem('adminAccessToken', accessToken);
          localStorage.setItem('adminRefreshToken', refreshToken);
          navigate('/');
        } else {
          setErrorMsg('Bu panele yalnızca Admin yetkisine sahip yöneticiler erişebilir.');
        }
      } else {
        setErrorMsg(response.data?.message || 'Giriş yapılamadı.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Giriş bilgileri hatalı veya sunucuya ulaşılamıyor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-orange-500 selection:text-white relative">

      {/* Üst Logo ve Başlık */}
      <div className="w-full max-w-md space-y-6">

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2.5">
            <span className="logo-font text-3xl sm:text-4xl text-slate-900 font-black tracking-tight">
              nexora<span className="text-orange-500 font-black">.com</span>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-black tracking-wider uppercase shadow-sm">
              Admin
            </span>
          </div>
          <p className="text-xs font-bold text-slate-700 tracking-wide">
            Merkezi Yönetim ve Mağaza Kontrol Paneli
          </p>
        </div>

        {/* Giriş Kartı */}
        <div className="bg-white border border-slate-300/80 rounded-3xl p-7 sm:p-9 shadow-xl shadow-slate-300/40 space-y-6">

          <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Yönetici Girişi</h2>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">Sistem yetkili hesabınızla erişin</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-300 text-rose-800 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800">Yönetici E-Postası</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nexora.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800">Şifre</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-xs rounded-xl shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 mt-4 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>GİRİŞ YAP</span>
                </>
              )}
            </button>
          </form>
        </div>
        <div className="text-center">
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-black text-slate-600 hover:text-orange-600 transition-colors inline-flex items-center gap-1.5"
          >
            <span>Ana Sayfaya Dön</span>
          </a>
        </div>

      </div>
    </div>
  );
};
