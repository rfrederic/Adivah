import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useAuth } from '../AuthContext';
import { TextField } from '../components/Fields';

export default function Account() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const bind = (name) => ({ value: form[name], onChange: (e) => setForm((f) => ({ ...f, [name]: e.target.value })) });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.next !== form.confirm) return setMessage({ ok: false, text: t('admin.account.mismatch') });
    setBusy(true);
    setMessage(null);
    try {
      await api.post('/api/auth/change-password', { currentPassword: form.current, newPassword: form.next });
      setForm({ current: '', next: '', confirm: '' });
      setMessage({ ok: true, text: t('admin.account.success') });
    } catch (err) {
      setMessage({ ok: false, text: t(`errors.${err.code}`, { defaultValue: t('errors.server_error') }) });
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  return (
    <>
      <h1 className="mb-2 text-4xl">{t('admin.account.title')}</h1>
      <p className="mb-6 text-ink-soft">{user.name} · {user.email} · {t('admin.account.role')}{t('common.colon')}{t(`admin.roles.${user.role}`)}</p>
      <form onSubmit={onSubmit} className="max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-2xl">{t('admin.account.changePassword')}</h2>
        {message && <p role={message.ok ? 'status' : 'alert'} className={`rounded-md border p-3 text-sm ${message.ok ? 'border-sky-200 bg-sky-50' : 'border-red-200 bg-red-50 text-red-900'}`}>{message.text}</p>}
        <p className="text-sm text-ink-soft">{t('admin.passwordRules')}</p>
        <TextField type="password" autoComplete="current-password" required label={t('admin.account.current')} {...bind('current')} />
        <TextField type="password" autoComplete="new-password" required label={t('admin.account.new')} {...bind('next')} />
        <TextField type="password" autoComplete="new-password" required label={t('admin.account.confirm')} {...bind('confirm')} />
        <button type="submit" className="btn btn-primary" disabled={busy}>{t('admin.account.submit')}</button>
      </form>
    </>
  );
}
