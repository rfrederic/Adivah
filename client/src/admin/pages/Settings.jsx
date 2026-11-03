import { Lock, MailCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LoadError, Loading } from '@/components/ui';
import { SOCIALS } from '@/config/areas';
import { useSettings } from '@/context/SettingsContext';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { useAuth } from '../AuthContext';
import { CheckField, LocalizedField, TextField, UploadField } from '../components/Fields';

const Group = ({ title, children }) => (
  <fieldset className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 sm:p-8">
    <legend className="px-2 font-serif text-2xl">{title}</legend>
    {children}
  </fieldset>
);
const FIELDS = ['logoUrl', 'email', 'phone', 'address', 'mapUrl', 'socials', 'seo', 'englishEnabled', 'maintenance', 'notificationEmail'];

export default function Settings() {
  const { t } = useTranslation();
  const { can } = useAuth();
  const { reload: reloadPublicSettings } = useSettings();
  const canEdit = can('settings.write');
  const { data, error, loading, reload } = useApi('/api/admin/settings');
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [mailResult, setMailResult] = useState(null);

  useEffect(() => {
    if (data) setForm({ notificationEmail: '', ...Object.fromEntries(FIELDS.filter((f) => data[f] !== undefined).map((f) => [f, data[f]])) });
  }, [data]);

  if (loading && !form) return <Loading />;
  if (error) return <LoadError onRetry={reload} />;
  if (!form) return <Loading />;

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const setNested = (group, name, value) => setForm((f) => ({ ...f, [group]: { ...f[group], [name]: value } }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage(null);
    try {
      await api.put('/api/admin/settings', form);
      reloadPublicSettings();
      setMessage({ ok: true, text: t('admin.editor.saved') });
    } catch (err) {
      setErrors(err.fields ?? {});
      setMessage({ ok: false, text: err.code === 'validation' ? t('admin.editor.invalid') : t(`errors.${err.code}`, { defaultValue: t('errors.server_error') }) });
    } finally {
      setSaving(false);
      window.scrollTo({ top: 0 });
    }
  };
  const testMail = async () => {
    setMailResult(null);
    const { sent } = await api.post('/api/admin/settings/test-email', {}).catch(() => ({ sent: false }));
    setMailResult(sent);
  };

  return (
    <>
      <h1 className="mb-6 text-4xl">{t('admin.settings.title')}</h1>
      {!canEdit && <p className="mb-4 rounded-md bg-slate-100 p-3 text-sm">{t('admin.settings.readOnly')}</p>}
      {message && <p role={message.ok ? 'status' : 'alert'} className={`mb-4 rounded-md border p-3 text-sm ${message.ok ? 'border-sky-200 bg-sky-50' : 'border-red-200 bg-red-50 text-red-900'}`}>{message.text}</p>}
      <form onSubmit={onSubmit} noValidate className="max-w-5xl space-y-6">
        <fieldset disabled={!canEdit} className="space-y-6">
          <Group title={t('admin.settings.identity')}>
            <div>
              <p className="label">{t('admin.settings.orgName')}</p>
              <p className="flex items-center gap-2 rounded-md bg-slate-100 p-3"><Lock aria-hidden="true" className="size-4 shrink-0 text-ink-soft" /> {data.orgName}</p>
              <p className="mt-1 text-sm text-ink-soft">{t('admin.settings.orgNameHelp')}</p>
            </div>
            <UploadField kind="image" category="logo" disabled={!canEdit} label={t('admin.settings.logo')} url={form.logoUrl} onChange={({ url }) => set('logoUrl', url)} />
          </Group>
          <Group title={t('admin.settings.contact')}>
            <div className="grid gap-5 md:grid-cols-2">
              <TextField type="email" label={t('admin.settings.email')} error={errors.email} value={form.email} onChange={(e) => set('email', e.target.value)} />
              <TextField label={t('admin.settings.phone')} error={errors.phone} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <LocalizedField name="address" label={t('admin.settings.address')} errors={errors} value={form.address} onChange={(v) => set('address', v)} />
            <TextField type="url" label={t('admin.settings.mapUrl')} error={errors.mapUrl} value={form.mapUrl} onChange={(e) => set('mapUrl', e.target.value)} />
          </Group>
          <Group title={t('admin.settings.socials')}>
            <div className="grid gap-5 md:grid-cols-2">
              {SOCIALS.map((s) => <TextField key={s} type="url" label={s.charAt(0).toUpperCase() + s.slice(1)} error={errors[`socials.${s}`]} value={form.socials?.[s] ?? ''} onChange={(e) => setNested('socials', s, e.target.value)} />)}
            </div>
          </Group>
          <Group title={t('admin.settings.language')}>
            <p className="text-sm text-ink-soft">{t('admin.settings.languageHelp')}</p>
            <CheckField disabled={!canEdit} label={t('admin.settings.englishEnabled')} checked={form.englishEnabled} onChange={(v) => set('englishEnabled', v)} />
          </Group>
          <Group title={t('admin.settings.seo')}>
            <LocalizedField name="seo.homeTitle" label={t('admin.settings.seoTitle')} help={t('admin.settings.seoHelp')} errors={errors} value={form.seo?.homeTitle} onChange={(v) => setNested('seo', 'homeTitle', v)} />
            <LocalizedField multiline name="seo.homeDescription" label={t('admin.settings.seoDescription')} errors={errors} value={form.seo?.homeDescription} onChange={(v) => setNested('seo', 'homeDescription', v)} />
            <UploadField kind="image" category="photo" disabled={!canEdit} label={t('admin.settings.ogImage')} url={form.seo?.ogImageUrl} onChange={({ url }) => setNested('seo', 'ogImageUrl', url)} />
          </Group>
          <Group title={t('admin.settings.maintenance')}>
            <CheckField disabled={!canEdit} label={t('admin.settings.maintenanceEnabled')} checked={Boolean(form.maintenance?.enabled)} onChange={(v) => setNested('maintenance', 'enabled', v)} />
            {form.maintenance?.enabled && <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">{t('admin.settings.maintenanceWarning')}</p>}
            <LocalizedField multiline name="maintenance.message" label={t('admin.settings.maintenanceMessage')} errors={errors} value={form.maintenance?.message} onChange={(v) => setNested('maintenance', 'message', v)} />
          </Group>
          {canEdit && (
            <Group title={t('admin.settings.emailConfig')}>
              <p className={`rounded-md p-3 text-sm ${data.mail.configured ? 'bg-sky-50' : 'bg-amber-50 text-amber-950'}`}>{data.mail.configured ? t('admin.settings.mailOn', { host: data.mail.host, port: data.mail.port }) : t('admin.settings.mailOff')}</p>
              <TextField type="email" label={t('admin.settings.notificationEmail')} help={t('admin.settings.notificationHelp')} error={errors.notificationEmail} value={form.notificationEmail} onChange={(e) => set('notificationEmail', e.target.value)} />
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className="btn btn-secondary btn-sm" onClick={testMail}><MailCheck aria-hidden="true" className="size-4" /> {t('admin.settings.testMail')}</button>
                {mailResult !== null && <span role="status" className="text-sm">{t(mailResult ? 'admin.settings.testMailOk' : 'admin.settings.testMailFail')}</span>}
              </div>
            </Group>
          )}
          {canEdit && <button type="submit" className="btn btn-primary" disabled={saving}>{t(saving ? 'admin.editor.saving' : 'admin.editor.save')}</button>}
        </fieldset>
      </form>
    </>
  );
}
