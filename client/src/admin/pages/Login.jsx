import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { LogoImage } from '@/components/layout/Logo';
import { TextField } from '../components/Fields';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login({ email, password });
    } catch (err) {
      setError(t(`errors.${err.code}`, { defaultValue: t('errors.server_error') }));
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-sky-100 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-sm">
        <div className="mb-4 flex justify-end"><LanguageSwitcher inAdmin /></div>
        <LogoImage className="mx-auto mb-4 size-24" alt={t('brand.logoAlt')} />
        <h1 className="mb-6 text-center text-3xl">{t('admin.login.title')}</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
          <TextField label={t('admin.login.email')} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label={t('admin.login.password')} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" disabled={busy} className="btn btn-primary w-full">{t(busy ? 'admin.login.submitting' : 'admin.login.submit')}</button>
        </form>
        <Link to="/admin/forgot-password" className="mt-4 block text-center text-sm text-sky-800 underline">{t('admin.login.forgot')}</Link>
      </div>
    </main>
  );
}
