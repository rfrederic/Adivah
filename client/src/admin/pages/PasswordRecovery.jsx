import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { LogoImage } from '@/components/layout/Logo';
import { api } from '@/lib/api';
import { TextField } from '../components/Fields';

const Shell = ({ title, children }) => (
  <main className="flex min-h-dvh items-center justify-center bg-sky-100 p-4">
    <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-sm">
      <div className="mb-4 flex justify-end"><LanguageSwitcher inAdmin /></div>
      <LogoImage className="mx-auto mb-4 size-20" alt="ADIVAH" />
      <h1 className="mb-6 text-center text-3xl">{title}</h1>
      {children}
    </div>
  </main>
);

export function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(t(`errors.${err.code}`, { defaultValue: t('errors.server_error') }));
    }
  };
  return (
    <Shell title={t('admin.recovery.forgotTitle')}>
      {sent ? <p role="status" className="rounded-md bg-sky-50 p-3 text-sm">{t('admin.recovery.sent')}</p> : (
        <form onSubmit={onSubmit} className="space-y-4">
          <p className="text-sm text-ink-soft">{t('admin.recovery.forgotText')}</p>
          {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
          <TextField label={t('admin.login.email')} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit" className="btn btn-primary w-full">{t('admin.recovery.send')}</button>
        </form>
      )}
      <Link to="/admin/login" className="mt-4 block text-center text-sm text-sky-800 underline">{t('admin.recovery.back')}</Link>
    </Shell>
  );
}

export function ResetPassword() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const onSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError(t('admin.account.mismatch'));
    setError('');
    try {
      await api.post('/api/auth/reset-password', { token: params.get('token') ?? '', newPassword: password });
      setDone(true);
    } catch (err) {
      setError(t(err.code === 'validation' ? 'errors.invalid_token' : `errors.${err.code}`, { defaultValue: t('errors.server_error') }));
    }
    return undefined;
  };
  return (
    <Shell title={t('admin.recovery.resetTitle')}>
      {done ? <p role="status" className="rounded-md bg-sky-50 p-3 text-sm">{t('admin.recovery.done')}</p> : (
        <form onSubmit={onSubmit} className="space-y-4">
          <p className="text-sm text-ink-soft">{t('admin.passwordRules')}</p>
          {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
          <TextField label={t('admin.account.new')} type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <TextField label={t('admin.account.confirm')} type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <button type="submit" className="btn btn-primary w-full">{t('admin.recovery.save')}</button>
        </form>
      )}
      <Link to="/admin/login" className="mt-4 block text-center text-sm text-sky-800 underline">{t('admin.recovery.back')}</Link>
    </Shell>
  );
}
