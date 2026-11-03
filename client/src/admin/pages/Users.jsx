import { KeyRound, Plus, Trash2, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Empty, LoadError, Loading } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { useAuth } from '../AuthContext';
import { useConfirm } from '../components/Confirm';
import { SelectField, TextField } from '../components/Fields';
import { formatDateTime } from '../components/Table';

const ROLES = ['super_admin', 'content_admin', 'editor', 'viewer'];

export default function Users() {
  const { t, i18n } = useTranslation();
  const { user: me } = useAuth();
  const confirm = useConfirm();
  const { data, error, loading, reload } = useApi('/api/admin/users');
  const { data: permissions } = useApi('/api/admin/permissions');
  const [form, setForm] = useState({ name: '', email: '', role: 'editor' });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const roleOptions = ROLES.map((r) => ({ value: r, label: t(`admin.roles.${r}`) }));

  const act = async (fn, okText) => {
    setNotice(null);
    try {
      const result = await fn();
      reload();
      if (okText) setNotice({ ok: true, text: okText(result) });
      return true;
    } catch (err) {
      setErrors(err.fields ?? {});
      setNotice({ ok: false, text: t(`errors.${err.code}`, { defaultValue: t('errors.server_error') }) });
      return false;
    }
  };
  const mailText = (sent, key) => t(sent ? `admin.users.${key}Sent` : 'admin.users.mailNotSent');

  const create = async (e) => {
    e.preventDefault();
    setErrors({});
    const done = await act(() => api.post('/api/admin/users', form), (r) => mailText(r.emailSent, 'invite'));
    if (done) setForm({ name: '', email: '', role: 'editor' });
  };
  const toggle = async (u) => {
    const suspended = u.status === 'suspended';
    if (await confirm({ title: t(suspended ? 'admin.users.confirmReactivate' : 'admin.users.confirmSuspend', { name: u.name }), danger: !suspended })) {
      act(() => api.patch(`/api/admin/users/${u._id}`, { status: suspended ? 'active' : 'suspended' }));
    }
  };
  const changeRole = async (u, role) => {
    if (await confirm({ title: t('admin.users.confirmRole', { name: u.name, role: t(`admin.roles.${role}`) }) })) act(() => api.patch(`/api/admin/users/${u._id}`, { role }));
  };
  const remove = async (u) => {
    if (await confirm({ title: t('admin.users.confirmDelete', { name: u.name }), danger: true, action: t('admin.list.delete') })) act(() => api.delete(`/api/admin/users/${u._id}`));
  };

  return (
    <>
      <h1 className="mb-6 text-4xl">{t('admin.users.title')}</h1>
      {notice && <p role={notice.ok ? 'status' : 'alert'} className={`mb-4 rounded-md border p-3 text-sm ${notice.ok ? 'border-sky-200 bg-sky-50' : 'border-red-200 bg-red-50 text-red-900'}`}>{notice.text}</p>}
      <form onSubmit={create} noValidate className="mb-8 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-[1fr_1fr_14rem_auto] md:items-end">
        <TextField label={t('admin.users.name')} error={errors.name} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <TextField type="email" label={t('admin.users.email')} error={errors.email} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        <SelectField label={t('admin.users.role')} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} options={roleOptions} />
        <button type="submit" className="btn btn-primary"><Plus aria-hidden="true" className="size-4" /> {t('admin.users.create')}</button>
        <p className="text-sm text-ink-soft md:col-span-4">{t('admin.users.inviteHelp')}</p>
      </form>
      {loading && !data && <Loading />}
      {error && <LoadError onRetry={reload} />}
      {data && !data.length && <Empty>{t('admin.list.empty')}</Empty>}
      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>{['name', 'role', 'status', 'lastLogin', 'actions'].map((c) => <th key={c} scope="col" className="p-3 font-semibold">{t(`admin.users.col.${c}`)}</th>)}</tr>
            </thead>
            <tbody>
              {data.map((u) => {
                const self = String(u._id) === String(me.id);
                const locked = u.lockedUntil && new Date(u.lockedUntil) > new Date();
                return (
                  <tr key={u._id} className="border-b border-slate-100 last:border-0">
                    <td className="p-3"><span className="font-medium">{u.name}</span><br /><span className="text-ink-soft">{u.email}</span></td>
                    <td className="p-3">
                      <label className="sr-only" htmlFor={`role-${u._id}`}>{t('admin.users.role')}</label>
                      <select id={`role-${u._id}`} className="input" disabled={self} value={u.role} onChange={(e) => changeRole(u, e.target.value)}>
                        {roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </td>
                    <td className="p-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${u.status === 'active' ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'}`}>{t(`admin.users.statuses.${u.status}`)}</span>
                      {locked && <span className="ml-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">{t('admin.users.locked')}</span>}
                    </td>
                    <td className="p-3 text-ink-soft">{formatDateTime(u.lastLoginAt, i18n.language) || t('admin.users.never')}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => act(() => api.post(`/api/admin/users/${u._id}/send-reset`), (r) => mailText(r.emailSent, 'reset'))}><KeyRound aria-hidden="true" className="size-3.5" /> {t('admin.users.sendReset')}</button>
                        {!self && <button type="button" className="btn btn-secondary btn-sm" onClick={() => toggle(u)}>{u.status === 'active' ? <UserX aria-hidden="true" className="size-3.5" /> : <UserCheck aria-hidden="true" className="size-3.5" />} {t(u.status === 'active' ? 'admin.users.suspend' : 'admin.users.reactivate')}</button>}
                        {!self && <button type="button" className="btn btn-danger btn-sm" aria-label={`${t('admin.list.delete')} ${u.name}`} onClick={() => remove(u)}><Trash2 aria-hidden="true" className="size-3.5" /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {permissions && (
        <section aria-labelledby="matrix" className="mt-10">
          <h2 id="matrix" className="mb-3 text-2xl">{t('admin.users.matrix')}</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr><th scope="col" className="p-3 font-semibold">{t('admin.users.permission')}</th>{ROLES.map((r) => <th key={r} scope="col" className="p-3 text-center font-semibold">{t(`admin.roles.${r}`)}</th>)}</tr>
              </thead>
              <tbody>
                {Object.entries(permissions).map(([permission, roles]) => (
                  <tr key={permission} className="border-b border-slate-100 last:border-0">
                    <th scope="row" className="p-3 font-medium">{t(`admin.permissions.${permission.replace('.', '_')}`)}</th>
                    {ROLES.map((r) => <td key={r} className="p-3 text-center">{roles.includes(r) ? <span aria-label={t('admin.users.yes')}>✓</span> : <span aria-label={t('admin.users.no')} className="text-slate-400">–</span>}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
