import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Empty, LoadError, Loading, Pagination } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { SelectField } from '../components/Fields';
import { formatDateTime, SearchBox } from '../components/Table';

const ACTIONS = ['login', 'logout', 'login_failed', 'account_locked', 'password_changed', 'password_reset_requested', 'password_reset', 'content.create', 'content.update', 'content.delete', 'content.submit', 'content.approve', 'content.reject', 'content.schedule', 'content.publish', 'content.unpublish', 'media.upload', 'media.update', 'media.replace', 'media.delete', 'message.status', 'message.delete', 'settings.update', 'site_content.update', 'user.create', 'user.update', 'user.role_change', 'user.suspend', 'user.reactivate', 'user.reset_sent', 'user.delete'];

export default function AuditLog() {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const query = new URLSearchParams({ page: String(page), limit: '50' });
  if (q) query.set('q', q);
  if (action) query.set('action', action);
  const { data, error, loading, reload } = useApi(`/api/admin/audit?${query}`);
  const label = (a) => t(`admin.audit.actions.${a}`, { defaultValue: a });
  return (
    <>
      <h1 className="mb-2 text-4xl">{t('admin.audit.title')}</h1>
      <p className="mb-6 text-ink-soft">{t('admin.audit.intro')}</p>
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_18rem]">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} />
        <SelectField label={<span className="sr-only">{t('admin.audit.action')}</span>} value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} options={[{ value: '', label: t('admin.audit.allActions') }, ...ACTIONS.map((a) => ({ value: a, label: label(a) }))]} />
      </div>
      {loading && !data && <Loading />}
      {error && <LoadError onRetry={reload} />}
      {data && !data.items.length && <Empty>{t('admin.audit.empty')}</Empty>}
      {data && data.items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>{['date', 'actor', 'action', 'target', 'details'].map((c) => <th key={c} scope="col" className="p-3 font-semibold">{t(`admin.audit.col.${c}`)}</th>)}</tr>
            </thead>
            <tbody>
              {data.items.map((r) => (
                <tr key={r._id} className="border-b border-slate-100 last:border-0">
                  <td className="whitespace-nowrap p-3 text-ink-soft"><time dateTime={r.createdAt}>{formatDateTime(r.createdAt, i18n.language)}</time></td>
                  <td className="p-3"><span className="font-medium">{r.actorName}</span><br /><span className="text-xs text-ink-soft">{r.actorEmail}</span></td>
                  <td className="p-3">{label(r.action)}</td>
                  <td className="p-3">{r.targetLabel}</td>
                  <td className="break-words p-3 text-ink-soft">{r.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
    </>
  );
}
