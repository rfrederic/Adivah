import { Archive, Check, Mail, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Empty, LoadError, Loading, Pagination } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/content';
import { useConfirm } from '../components/Confirm';
import { SelectField } from '../components/Fields';

const TYPES = ['contact', 'volunteer', 'partner', 'support', 'participate'];
const STATUSES = ['new', 'read', 'archived'];

export default function Messages() {
  const { t, i18n } = useTranslation();
  const confirm = useConfirm();
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState('');
  const query = new URLSearchParams({ page: String(page), limit: '20' });
  if (type) query.set('type', type);
  if (status) query.set('status', status);
  const { data, error, loading, reload } = useApi(`/api/admin/submissions?${query}`);

  const act = async (fn) => {
    setActionError('');
    try {
      await fn();
      reload();
    } catch (err) {
      setActionError(t(`errors.${err.code}`, { defaultValue: t('errors.server_error') }));
    }
  };
  const setItemStatus = (item, value) => act(() => api.patch(`/api/admin/submissions/${item._id}`, { status: value }));
  const remove = async (item) => {
    if (await confirm({ title: t('admin.messages.confirmDelete'), danger: true, action: t('admin.list.delete') })) act(() => api.delete(`/api/admin/submissions/${item._id}`));
  };

  return (
    <>
      <h1 className="mb-6 text-4xl">{t('admin.messages.title')}</h1>
      <div className="mb-6 grid max-w-xl gap-4 sm:grid-cols-2">
        <SelectField label={t('admin.messages.filterType')} value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} options={[{ value: '', label: t('admin.messages.allTypes') }, ...TYPES.map((v) => ({ value: v, label: t(`admin.messages.types.${v}`) }))]} />
        <SelectField label={t('admin.messages.filterStatus')} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={[{ value: '', label: t('admin.messages.allStatuses') }, ...STATUSES.map((v) => ({ value: v, label: t(`admin.messages.statuses.${v}`) }))]} />
      </div>
      {actionError && <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">{actionError}</p>}
      {loading && !data && <Loading />}
      {error && <LoadError onRetry={reload} />}
      {data && !data.items.length && <Empty>{t('admin.messages.empty')}</Empty>}
      {data && data.items.length > 0 && (
        <ul className="space-y-4">
          {data.items.map((item) => (
            <li key={item._id} className={`rounded-lg border bg-white p-5 ${item.status === 'new' ? 'border-sky-500' : 'border-slate-200'}`}>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded bg-sky-100 px-2 py-0.5 text-sky-900">{t(`admin.messages.types.${item.type}`)}</span>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-slate-800">{t(`admin.messages.statuses.${item.status}`)}</span>
                <time dateTime={item.createdAt} className="font-normal text-ink-soft">{formatDate(item.createdAt, i18n.language)}</time>
              </div>
              {item.subject && <h2 className="mt-3 font-sans text-lg font-semibold">{item.subject}</h2>}
              <p className="mt-2 text-sm"><strong>{t('admin.messages.from')}{t('common.colon').trimEnd()}</strong> {item.name} · {item.email}{item.phone ? ` · ${item.phone}` : ''}{item.organization ? ` · ${item.organization}` : ''}</p>
              <p className="mt-3 whitespace-pre-wrap break-words">{item.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`mailto:${item.email}?subject=${encodeURIComponent(item.subject || 'ADIVAH')}`} className="btn btn-primary btn-sm"><Mail aria-hidden="true" className="size-3.5" /> {t('admin.messages.reply')}</a>
                {item.status === 'new' && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setItemStatus(item, 'read')}><Check aria-hidden="true" className="size-3.5" /> {t('admin.messages.markRead')}</button>}
                {item.status !== 'archived' && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setItemStatus(item, 'archived')}><Archive aria-hidden="true" className="size-3.5" /> {t('admin.messages.archive')}</button>}
                <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(item)}><Trash2 aria-hidden="true" className="size-3.5" /> {t('admin.list.delete')}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
    </>
  );
}
