import React, { useState, useEffect } from 'react';
import { User, Mail, CheckCircle2, XCircle, Clock, Check } from 'lucide-react';
import type { UserProfileDto } from '../../types/user';

interface AccountSecurityTabProps {
  userProfile: UserProfileDto | null;
  isSaving: boolean;
  profileError: string | null;
  profileSuccess: string | null;
  onSaveProfile: (data: {
    firstName: string;
    lastName: string;
    email: string;
    currentPassword?: string;
  }) => Promise<void>;
  onVerifyPendingEmail: (code: string) => Promise<void>;
  onResendPendingCode: () => Promise<void>;
  onCancelPendingEmail: () => Promise<void>;
}

export const AccountSecurityTab: React.FC<AccountSecurityTabProps> = ({
  userProfile,
  isSaving,
  profileError,
  profileSuccess,
  onSaveProfile,
  onVerifyPendingEmail,
  onResendPendingCode,
  onCancelPendingEmail,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.firstName || '');
      setLastName(userProfile.lastName || '');
      setEmail(userProfile.email || '');
    }
  }, [userProfile]);

  const isEmailChanged =
    userProfile && email.trim().toLowerCase() !== userProfile.email.toLowerCase();

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void onSaveProfile({
      firstName,
      lastName,
      email,
      currentPassword: currentPassword || undefined,
    });
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingEmail(true);
    try {
      await onVerifyPendingEmail(verificationCode);
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">Kişisel Bilgilerim</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hesap bilgilerinizi ve iletişim detaylarınızı buradan güncelleyebilirsiniz.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-orange-50/80 border border-orange-100/90 rounded-xl text-orange-700 text-xs font-semibold">
          <User className="w-3.5 h-3.5 text-orange-500" />
          <span>Profil Ayarları</span>
        </div>
      </div>

      {profileError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs font-medium animate-in fade-in-50">
          <XCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{profileError}</span>
        </div>
      )}

      {profileSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center gap-2.5 text-emerald-700 text-xs font-medium animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{profileSuccess}</span>
        </div>
      )}

      {userProfile?.pendingEmail && (
        <form onSubmit={handleVerifySubmit} className="p-4 border border-amber-200 bg-amber-50/40 rounded-2xl space-y-3">
          <p className="text-xs text-slate-700 font-medium">
            <strong className="font-bold text-slate-900">{userProfile.pendingEmail}</strong> adresine gelen onay kodunu girin. Onay sonrası tekrar giriş yapmanız gerekecektir.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <label htmlFor="pending-email-code" className="sr-only">
              Doğrulama kodu
            </label>
            <input
              id="pending-email-code"
              autoComplete="one-time-code"
              inputMode="numeric"
              required
              placeholder="6 haneli doğrulama kodu"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold tracking-widest focus:outline-hidden focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={isVerifyingEmail || !verificationCode.trim()}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isVerifyingEmail ? 'Doğrulanıyor...' : 'E-postayı Doğrula'}
            </button>
            <button
              type="button"
              disabled={isVerifyingEmail}
              onClick={() => void onResendPendingCode()}
              className="px-3 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-50 cursor-pointer"
            >
              Kodu Yeniden Gönder
            </button>
            <button
              type="button"
              disabled={isVerifyingEmail}
              onClick={() => void onCancelPendingEmail()}
              className="px-3 py-2 border border-rose-200 text-rose-600 rounded-xl text-xs font-medium hover:bg-rose-50 cursor-pointer"
            >
              Vazgeç
            </button>
          </div>
        </form>
      )}

      <form onSubmit={handleProfileSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="profile-first-name" className="text-xs font-bold text-slate-700 block">
              Ad *
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                id="profile-first-name"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Adınız"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-last-name" className="text-xs font-bold text-slate-700 block">
              Soyad *
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                id="profile-last-name"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Soyadınız"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <label htmlFor="profile-email" className="text-xs font-bold text-slate-700 block">
                E-Posta Adresi *
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Giriş ve sipariş bildirimleri için kullanılır</span>
            </div>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                id="profile-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@domain.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
              />
            </div>
          </div>
        </div>

        {isEmailChanged && (
          <div className="space-y-2 p-4 bg-orange-50/40 border border-orange-200/80 rounded-2xl">
            <label htmlFor="profile-current-password" className="text-xs font-bold text-slate-800 block">
              E-posta değişikliği için mevcut parolanız *
            </label>
            <input
              id="profile-current-password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Mevcut parolanızı girin"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-orange-500"
            />
          </div>
        )}

        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>Kaydediliyor...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Değişiklikleri Kaydet</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
