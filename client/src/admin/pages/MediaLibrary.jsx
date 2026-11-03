import { FileText, Pencil, RefreshCw, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Empty, LoadError, Loading, Pagination } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { formatSize, pick } from '@/lib/content';
import { useAuth } from '../AuthContext';
import { Modal, useConfirm } from '../components/Confirm';
import { LocalizedField, SelectField } from '../components/Fields';
import { SearchBox } from '../components/Table';

const CATEGORIES = ['logo', 'photo', 'project', 'team', 'partner', 'report', 'other'];

function EditDialog({ media, onClose, onSaved }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ category: media.category, alt: media.alt ?? { fr: '', en: '' }, description: media.description ?? { fr: '', en: '' } });
  const [error, setError] = useState('');
  const save = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/admin/media/${media._id}`, form);
      onSaved();
    } catch (err) {
      setError(t(`errors.${err.code}`, { defaultValue: t('errors.server_error') }));
    }
  };
  return (
    <Modal wide title={media.originalName} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <SelectField label={t('admin.media.category')} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} options={CATEGORIES.map((c) => ({ value: c, label: t(`admin.media.categories.${c}`) }))} />
        <LocalizedField label={t('admin.media.alt')} value={form.alt} onChange={(alt) => setForm((f) => ({ ...f, alt }))} />
        <LocalizedField multiline label={t('admin.media.description')} value={form.description} onChange={(description) => setForm((f) => ({ ...f, description }))} />
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>{t('admin.editor.cancel')}</button>
          <button type="submit" className="btn btn-primary btn-sm">{t('admin.editor.save')}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function MediaLibrary() {
  const { t, i18n } = useTranslation();
  const { can } = useAuth();
  const confirm = useConfirm();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [kind, setKind] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('photo');
  const query = new URLSearchParams({ page: String(page), limit: '24' });
  if (q) query.set('q', q);
  if (category) query.set('category', category);
  if (kind) query.set('kind', kind);
  const { data, error: loadError, loading, reload } = useApi(`/api/admin/media?${query}`);
  const canWrite = can('media.write');
  const canManage = can('media.manage');
  const options = CATEGORIES.map((c) => ({ value: c, label: t(`admin.media.categories.${c}`) }));

  const act = async (fn) => {
    setError('');
    setBusy(true);
    try {
      await fn();
      reload();
    } catch (err) {
      setError(t(`errors.${err.code}`, { defaultValue: t('errors.upload_failed') }));
    } finally {
      setBusy(false);
    }
  };
  const fileForm = (file) => {
    const form = new FormData();
    form.append('file', file);
    return form;
  };
  const upload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const type = file.type === 'application/pdf' ? 'document' : 'image';
    act(() => api.post(`/api/admin/uploads/${type}?category=${uploadCategory}`, fileForm(file)));
  };
  const replace = (media, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) act(() => api.post(`/api/admin/media/${media._id}/replace`, fileForm(file)));
  };
  const remove = async (media) => {
    if (await confirm({ title: t('admin.media.confirmDelete', { name: media.originalName }), danger: true, action: t('admin.list.delete') })) act(() => api.delete(`/api/admin/media/${media._id}`));
  };

  return (
    <>
      <h1 className="mb-2 text-4xl">{t('admin.media.title')}</h1>
      <p className="mb-6 text-ink-soft">{t('admin.media.intro')}</p>
      {canWrite && (
        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <SelectField label={t('admin.media.category')} value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} options={options} />
          <label className={`btn btn-primary btn-sm cursor-pointer ${busy ? 'pointer-events-none opacity-60' : ''}`}>
            <Upload aria-hidden="true" className="size-4" /> {t('admin.media.upload')}
            <input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={upload} disabled={busy} />
          </label>
          <p className="basis-full text-sm text-ink-soft">{t('admin.media.limits')}</p>
        </div>
      )}
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_12rem_12rem]">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} />
        <SelectField label={<span className="sr-only">{t('admin.media.category')}</span>} value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} options={[{ value: '', label: t('admin.media.allCategories') }, ...options]} />
        <SelectField label={<span className="sr-only">{t('admin.media.kind')}</span>} value={kind} onChange={(e) => { setKind(e.target.value); setPage(1); }} options={[{ value: '', label: t('admin.media.allKinds') }, { value: 'image', label: t('admin.media.images') }, { value: 'document', label: t('admin.media.documents') }]} />
      </div>
      {error && <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
      {loading && !data && <Loading />}
      {loadError && <LoadError onRetry={reload} />}
      {data && !data.items.length && <Empty>{t('admin.media.empty')}</Empty>}
      {data && data.items.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.items.map((m) => (
            <li key={m._id} className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
              {m.kind === 'image'
                ? <img src={m.url} alt={pick(m.alt, i18n.language)} loading="lazy" className="aspect-[4/3] w-full bg-slate-100 object-contain" />
                : <a href={m.url} target="_blank" rel="noopener noreferrer" aria-label={m.originalName} className="flex aspect-[4/3] items-center justify-center bg-sky-100 text-sky-800"><FileText aria-hidden="true" className="size-10" /></a>}
              <div className="flex flex-1 flex-col p-3 text-sm">
                <p className="truncate font-medium" title={m.originalName}>{m.originalName}</p>
                <p className="text-xs text-ink-soft">{t(`admin.media.categories.${m.category}`)} · {formatSize(m.size)}{m.width ? ` · ${m.width}×${m.height}` : ''}</p>
                {!pick(m.alt, i18n.language) && m.kind === 'image' && <p className="mt-1 text-xs font-semibold text-amber-800">{t('admin.media.missingAlt')}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {canWrite && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(m)}><Pencil aria-hidden="true" className="size-3.5" /> {t('admin.list.edit')}</button>}
                  {canManage && (
                    <label className="btn btn-secondary btn-sm cursor-pointer">
                      <RefreshCw aria-hidden="true" className="size-3.5" /> {t('admin.media.replace')}
                      <input type="file" className="sr-only" accept={m.kind === 'image' ? 'image/jpeg,image/png,image/webp' : 'application/pdf'} onChange={(e) => replace(m, e)} />
                    </label>
                  )}
                  {canManage && <button type="button" className="btn btn-danger btn-sm" aria-label={`${t('admin.list.delete')} ${m.originalName}`} onClick={() => remove(m)}><Trash2 aria-hidden="true" className="size-3.5" /></button>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
      {editing && <EditDialog media={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
}
