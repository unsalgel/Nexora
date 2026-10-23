import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';

export const VerifyEmailPage = () => {
  const location = useLocation();
  const [email, setEmail] = useState(() => typeof location.state?.email === 'string' ? location.state.email : '');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState('Kayıt uygunsa doğrulama kodu e-postanıza gönderilir. Kaldığınız yerden devam etmek için e-posta adresinizi ve kodunuzu girin.');
  const [verified, setVerified] = useState(false);
  const inFlight = useRef(false);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const submit = async (resend: boolean) => {
    if (inFlight.current || (resend && cooldown > 0)) return;
    if (!email.trim() || (!resend && !/^\d{6}$/.test(code))) {
      setMessage('E-posta adresinizi ve doğrulama için 6 haneli kodunuzu girin.');
      return;
    }
    inFlight.current = true;
    setPending(true);
    try {
      const response = await apiClient.post(resend ? '/auth/resend-verification-code' : '/auth/verify-email',
        resend ? { email: email.trim() } : { email: email.trim(), code });
      if (!response.data?.isSuccess) throw new Error('Verification failed');
      if (resend) {
        setMessage('Hesap doğrulamaya uygunsa yeni kod gönderildi. Gelen kutunuzu kontrol edin.');
        setCooldown(60);
      } else {
        setVerified(true);
        setCode('');
        setMessage('E-posta adresiniz doğrulandı. Şimdi giriş yapabilirsiniz.');
      }
    } catch {
      setMessage(resend ? 'Kod gönderilemedi. Bir süre sonra tekrar deneyin.' : 'Doğrulama tamamlanamadı. E-posta adresini, kodu ve kodun süresini kontrol edin.');
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  return <section className="max-w-md mx-auto my-10 p-6 bg-white border border-slate-200 rounded-2xl space-y-5">
    <h1 className="text-xl font-bold">E-posta doğrulama</h1>
    <p role="status" className="text-sm text-slate-600">{message}</p>
    {!verified && <form onSubmit={event => { event.preventDefault(); void submit(false); }} className="space-y-4">
      <label className="block text-sm">E-posta adresi
        <input type="email" autoComplete="email" required disabled={pending} value={email}
          onChange={event => setEmail(event.target.value)} className="block w-full mt-1 p-3 border rounded-xl" />
      </label>
      <label className="block text-sm">6 haneli doğrulama kodu
        <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required disabled={pending}
          value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          className="block w-full mt-1 p-3 border rounded-xl tracking-widest" />
      </label>
      <button type="submit" disabled={pending} className="w-full p-3 rounded-xl bg-orange-500 text-white disabled:opacity-50">Doğrula</button>
      <button type="button" disabled={pending || cooldown > 0} onClick={() => void submit(true)}
        className="w-full text-sm text-orange-700 disabled:opacity-50">{cooldown > 0 ? `Tekrar gönder (${cooldown}s)` : 'Kodu tekrar gönder'}</button>
    </form>}
    <Link to="/login" className="block text-center text-sm text-orange-700">Giriş ekranına dön</Link>
  </section>;
};
