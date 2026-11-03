import { ArrowLeft, CalendarClock, Check, Eye, Pencil, Plus, Send, Trash2, Undo2, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Empty, LoadError, Loading, Pagination } from '@/components/ui';
import { AREAS, ARTICLE_CATEGORIES, PROJECT_STATUSES, PUBLICATION_TYPES } from '@/config/areas';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { pick } from '@/lib/content';
import { useAuth } from '../AuthContext';
import { useConfirm } from '../components/Confirm';
import { CheckField, LocalizedField, SelectField, TextField, UploadField } from '../components/Fields';
import { HistoryFields } from '../components/HistoryFields';
import { PhotoListField } from '../components/PhotoListField';
import { formatDateTime, SearchBox, SortHeader, StatusBadge } from '../components/Table';

const blank = { fr: '', en: '' };
const dateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');
const CAMPAIGN_STATUSES = ['upcoming', 'active', 'completed'];
const WORKFLOW = ['draft', 'pending', 'approved', 'rejected', 'published'];

/** Description des contenus : un seul éditeur les gère tous. */
const RESOURCES = {
  projects: {
    category: 'project',
    empty: () => ({ title: blank, summary: blank, body: blank, location: blank, date: '', datePrecision: 'day', status: 'to-confirm', category: AREAS[0].key, image: { url: '', alt: blank }, gallery: [], isSample: false }),
    fields: [
      { type: 'localized', name: 'title' },
      { type: 'localized', name: 'summary', multiline: true },
      { type: 'localized', name: 'body', multiline: true, rows: 10, help: 'admin.editor.bodyHelp' },
      { type: 'localized', name: 'location' },
      { type: 'date', name: 'date' },
      { type: 'select', name: 'datePrecision', options: (t) => ['day', 'month', 'year'].map((p) => ({ value: p, label: t(`admin.fields.precision.${p}`) })) },
      { type: 'select', name: 'status', options: (t) => PROJECT_STATUSES.map((s) => ({ value: s, label: t(`projectStatus.${s}`) })) },
      { type: 'select', name: 'category', options: (t) => AREAS.map(({ key }) => ({ value: key, label: t(`areaKeys.${key}`) })) },
      { type: 'image', name: 'image', help: 'admin.fields.featuredHelp' },
      { type: 'gallery', name: 'gallery' },
    ],
  },
  articles: {
    category: 'photo',
    empty: () => ({ title: blank, excerpt: blank, body: blank, category: ARTICLE_CATEGORIES[0], image: { url: '', alt: blank }, publishedAt: '', isSample: false }),
    fields: [
      { type: 'localized', name: 'title' },
      { type: 'localized', name: 'excerpt', multiline: true },
      { type: 'localized', name: 'body', multiline: true, rows: 14, help: 'admin.editor.bodyHelp' },
      { type: 'select', name: 'category', options: (t) => ARTICLE_CATEGORIES.map((c) => ({ value: c, label: t(`articleCategory.${c}`) })) },
      { type: 'date', name: 'publishedAt', help: 'admin.fields.publishedAtHelp' },
      { type: 'image', name: 'image' },
    ],
  },
  publications: {
    category: 'report',
    empty: () => ({ title: blank, description: blank, type: PUBLICATION_TYPES[0], fileUrl: '', fileSize: 0, year: '', language: 'fr', isSample: false }),
    fields: [
      { type: 'localized', name: 'title' },
      { type: 'localized', name: 'description', multiline: true },
      { type: 'select', name: 'type', options: (t) => PUBLICATION_TYPES.map((p) => ({ value: p, label: t(`publicationType.${p}`) })) },
      { type: 'select', name: 'language', options: (t) => ['fr', 'en', 'both'].map((l) => ({ value: l, label: t(`publications.languages.${l}`) })) },
      { type: 'number', name: 'year', min: 1900, max: 2100 },
      { type: 'file', name: 'fileUrl' },
    ],
  },
  campaigns: {
    category: 'photo',
    empty: () => ({ title: blank, summary: blank, body: blank, campaignStatus: 'upcoming', startDate: '', endDate: '', image: { url: '', alt: blank }, isSample: false }),
    fields: [
      { type: 'localized', name: 'title' },
      { type: 'localized', name: 'summary', multiline: true },
      { type: 'localized', name: 'body', multiline: true, rows: 12, help: 'admin.editor.bodyHelp' },
      { type: 'select', name: 'campaignStatus', options: (t) => CAMPAIGN_STATUSES.map((s) => ({ value: s, label: t(`campaigns.status.${s}`) })) },
      { type: 'date', name: 'startDate' },
      { type: 'date', name: 'endDate' },
      { type: 'image', name: 'image' },
    ],
  },
  team: {
    category: 'team',
    named: true,
    empty: () => ({ name: '', position: blank, bio: blank, image: { url: '', alt: blank }, order: 0, isSample: false }),
    fields: [
      { type: 'text', name: 'name' },
      { type: 'localized', name: 'position' },
      { type: 'localized', name: 'bio', multiline: true, rows: 6 },
      { type: 'number', name: 'order', min: 0, max: 9999, help: 'admin.fields.orderHelp' },
      { type: 'image', name: 'image' },
    ],
  },
  partners: {
    category: 'partner',
    named: true,
    empty: () => ({ name: '', description: blank, website: '', image: { url: '', alt: blank }, order: 0, isSample: false }),
    fields: [
      { type: 'text', name: 'name' },
      { type: 'localized', name: 'description', multiline: true },
      { type: 'text', inputType: 'url', name: 'website' },
      { type: 'number', name: 'order', min: 0, max: 9999, help: 'admin.fields.orderHelp' },
      { type: 'image', name: 'image' },
    ],
  },
};

const SERVER_FIELDS = ['_id', 'slug', '__v', 'createdAt', 'updatedAt', 'published', 'workflowStatus', 'publishAt', 'createdBy', 'updatedBy', 'submittedBy', 'approvedBy', 'publishedBy', 'history'];
const toForm = (data, config) => {
  const form = Object.fromEntries(Object.entries(data).filter(([k]) => !SERVER_FIELDS.includes(k)));
  for (const field of config.fields) {
    if (field.type === 'date') form[field.name] = dateInput(data[field.name]);
    if (field.type === 'number') form[field.name] = data[field.name] ?? '';
  }
  return form;
};
const titleOf = (item, lang) => item.name ?? pick(item.title, lang);
const errorText = (t, err) => t(`errors.${err.code}`, { defaultValue: t('errors.server_error') });

export function ResourceList() {
  const { resource } = useParams();
  return RESOURCES[resource] ? <List key={resource} resource={resource} /> : <Navigate to="/admin" replace />;
}

function List({ resource }) {
  const config = RESOURCES[resource];
  const { t, i18n } = useTranslation();
  const { can } = useAuth();
  const confirm = useConfirm();
  const nameField = config.named ? 'name' : 'title.fr';
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('updatedAt');
  const [dir, setDir] = useState('desc');
  const [page, setPage] = useState(1);
  const query = new URLSearchParams({ page: String(page), limit: '20', sort, dir });
  if (q) query.set('q', q);
  if (status) query.set('status', status);
  const { data, error, loading, reload } = useApi(`/api/admin/${resource}?${query}`);
  const [actionError, setActionError] = useState('');

  const onSort = (field) => {
    if (sort === field) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSort(field);
      setDir(field === 'updatedAt' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  const remove = async (item) => {
    const title = titleOf(item, i18n.language);
    const ok = await confirm({ title: t('admin.list.confirmDelete', { title }), danger: true, action: t('admin.list.delete') });
    if (!ok) return;
    setActionError('');
    try {
      await api.delete(`/api/admin/${resource}/${item._id}`);
      reload();
    } catch (err) {
      setActionError(errorText(t, err));
    }
  };

  const sortProps = { sort, dir, onSort };
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">{t(`admin.resources.${resource}`)}</h1>
        {can('content.write') && <Link to={`/admin/${resource}/new`} className="btn btn-primary btn-sm"><Plus aria-hidden="true" className="size-4" /> {t('admin.list.add')}</Link>}
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_14rem]">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} />
        <SelectField label={<span className="sr-only">{t('admin.list.filterStatus')}</span>} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={[{ value: '', label: t('admin.list.allStatuses') }, ...WORKFLOW.map((s) => ({ value: s, label: t(`admin.workflow.status.${s}`) }))]} />
      </div>
      {actionError && <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">{actionError}</p>}
      {loading && !data && <Loading />}
      {error && <LoadError onRetry={reload} />}
      {data && !data.items.length && <Empty>{q || status ? t('admin.list.noMatch') : t('admin.list.empty')}</Empty>}
      {data && data.items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <SortHeader field={nameField} label={t('admin.list.colTitle')} {...sortProps} />
                <SortHeader field="workflowStatus" label={t('admin.list.colState')} {...sortProps} />
                <SortHeader field="updatedAt" label={t('admin.list.colUpdated')} {...sortProps} />
                <th scope="col" className="p-3 text-right font-semibold">{t('admin.list.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item._id} className="border-b border-slate-100 last:border-0">
                  <td className="p-3 font-medium">{titleOf(item, i18n.language)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1.5">
                      <StatusBadge status={item.workflowStatus} />
                      {item.publishAt && <span className="rounded bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-900">{t('admin.workflow.scheduledFor', { date: formatDateTime(item.publishAt, i18n.language) })}</span>}
                      {item.isSample && <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">{t('admin.list.sample')}</span>}
                      {item.title && !item.title.en && <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800">{t('admin.list.missingEn')}</span>}
                    </div>
                  </td>
                  <td className="p-3 text-ink-soft">{formatDateTime(item.updatedAt, i18n.language)}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Link to={`/admin/preview/${resource}/${item._id}`} className="btn btn-secondary btn-sm"><Eye aria-hidden="true" className="size-3.5" /> {t('admin.preview.button')}</Link>
                      <Link to={`/admin/${resource}/${item._id}`} className="btn btn-secondary btn-sm"><Pencil aria-hidden="true" className="size-3.5" /> {t(can('content.write') ? 'admin.list.edit' : 'admin.list.view')}</Link>
                      {can('content.delete') && <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(item)}><Trash2 aria-hidden="true" className="size-3.5" /> {t('admin.list.delete')}</button>}
                    </div>
                  </td>
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

/** Boutons du circuit de validation : n'affiche que les actions possibles. Le serveur revérifie chaque droit. */
function WorkflowPanel({ resource, item, onChange, dirty }) {
  const { t, i18n } = useTranslation();
  const { can } = useAuth();
  const confirm = useConfirm();
  const [comment, setComment] = useState('');
  const [publishAt, setPublishAt] = useState('');
  const [error, setError] = useState('');
  const status = item.workflowStatus;

  const run = async (action, body = {}) => {
    setError('');
    try {
      await api.post(`/api/admin/${resource}/${item._id}/${action}`, body);
      setComment('');
      setPublishAt('');
      onChange();
    } catch (err) {
      setError(errorText(t, err));
    }
  };
  const confirmed = async (action, key) => {
    if (await confirm({ title: t(`admin.workflow.confirm.${key}`) })) run(action, { comment });
  };

  const review = can('content.review');
  return (
    <section aria-labelledby="workflow-title" className="mt-6 max-w-5xl space-y-4 rounded-lg border border-slate-200 bg-white p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="workflow-title" className="text-2xl">{t('admin.workflow.title')}</h2>
        <StatusBadge status={status} />
      </div>
      <ol className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-soft">
        {['draft', 'pending', 'approved', 'published'].map((s, i) => (
          <li key={s} className="flex items-center gap-2">{i > 0 && <span aria-hidden="true">→</span>}<span className={s === status ? 'rounded bg-sky-100 px-2 py-0.5 text-sky-900' : ''} aria-current={s === status ? 'step' : undefined}>{t(`admin.workflow.status.${s}`)}</span></li>
        ))}
      </ol>
      {dirty && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-950">{t('admin.workflow.saveFirst')}</p>}
      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
      {item.publishAt && <p className="text-sm font-semibold">{t('admin.workflow.scheduledFor', { date: formatDateTime(item.publishAt, i18n.language) })}</p>}

      {can('content.write') && !dirty && (
        <>
          {review && (
            <div>
              <label htmlFor="wf-comment" className="label">{t('admin.workflow.comment')}</label>
              <textarea id="wf-comment" rows={2} className="input" value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {['draft', 'rejected'].includes(status) && <button type="button" className="btn btn-primary btn-sm" onClick={() => run('submit')}><Send aria-hidden="true" className="size-4" /> {t('admin.workflow.submit')}</button>}
            {review && ['draft', 'pending'].includes(status) && <button type="button" className="btn btn-primary btn-sm" onClick={() => run('approve', { comment })}><Check aria-hidden="true" className="size-4" /> {t('admin.workflow.approve')}</button>}
            {review && ['pending', 'approved'].includes(status) && <button type="button" className="btn btn-danger btn-sm" onClick={() => run('reject', { comment })}><X aria-hidden="true" className="size-4" /> {t('admin.workflow.reject')}</button>}
            {review && status === 'approved' && <button type="button" className="btn btn-primary btn-sm" onClick={() => confirmed('publish', 'publish')}><Upload aria-hidden="true" className="size-4" /> {t('admin.workflow.publish')}</button>}
            {review && status === 'published' && <button type="button" className="btn btn-danger btn-sm" onClick={() => confirmed('unpublish', 'unpublish')}><Undo2 aria-hidden="true" className="size-4" /> {t('admin.workflow.unpublish')}</button>}
          </div>
          {review && status === 'approved' && (
            <div className="flex flex-wrap items-end gap-2 border-t border-slate-200 pt-4">
              <div>
                <label htmlFor="wf-date" className="label">{t('admin.workflow.scheduleAt')}</label>
                <input id="wf-date" type="datetime-local" className="input" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} />
              </div>
              <button type="button" className="btn btn-secondary btn-sm" disabled={!publishAt} onClick={() => run('schedule', { publishAt: new Date(publishAt).toISOString() })}><CalendarClock aria-hidden="true" className="size-4" /> {t('admin.workflow.schedule')}</button>
              {item.publishAt && <button type="button" className="btn btn-secondary btn-sm" onClick={() => run('schedule', {})}>{t('admin.workflow.cancelSchedule')}</button>}
            </div>
          )}
        </>
      )}

      <div className="border-t border-slate-200 pt-4">
        <h3 className="mb-2 font-sans text-sm font-semibold">{t('admin.workflow.history')}</h3>
        <ul className="space-y-2 text-sm">
          {[...(item.history ?? [])].reverse().map((h, i) => (
            <li key={`${h.at}-${i}`}>
              <span className="text-ink-soft">{formatDateTime(h.at, i18n.language)}</span> · <strong>{h.by?.name}</strong> · {t(`admin.workflow.actions.${h.action}`, { defaultValue: h.action })}
              {h.comment && <p className="mt-1 rounded bg-slate-50 p-2">{h.comment}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ResourceEditor() {
  const { resource, id } = useParams();
  const config = RESOURCES[resource];
  const { t } = useTranslation();
  const { can } = useAuth();
  const navigate = useNavigate();
  const { data, error: loadError, loading, reload } = useApi(config && id ? `/api/admin/${resource}/${id}` : null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!config) return;
    if (!id) setForm(config.empty());
    else if (data) {
      setForm(toForm(data, config));
      setDirty(false);
    }
  }, [config, id, data]);

  if (!config) return <Navigate to="/admin" replace />;
  if (loading && !form) return <Loading />;
  if (loadError) return <LoadError onRetry={reload} />;
  if (!form) return <Loading />;

  const change = (updater) => {
    setDirty(true);
    setForm(updater);
  };
  const set = (name, value) => change((f) => ({ ...f, [name]: value }));
  const locked = !can('content.write') || (data?.workflowStatus === 'published' && !can('content.review'));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage(null);
    try {
      if (id) {
        await api.put(`/api/admin/${resource}/${id}`, form);
        reload();
        setMessage({ ok: true, text: t('admin.editor.saved') });
      } else {
        const created = await api.post(`/api/admin/${resource}`, form);
        navigate(`/admin/${resource}/${created._id}`);
      }
    } catch (err) {
      setErrors(err.fields ?? {});
      setMessage({ ok: false, text: err.code === 'validation' ? t('admin.editor.invalid') : errorText(t, err) });
    } finally {
      setSaving(false);
      window.scrollTo({ top: 0 });
    }
  };

  const renderField = (field) => {
    const label = t(`admin.fields.${field.name === 'fileUrl' ? 'file' : field.name}`);
    const help = field.help && t(field.help);
    switch (field.type) {
      case 'localized':
        return <LocalizedField key={field.name} name={field.name} label={label} multiline={field.multiline} rows={field.rows} help={help} errors={errors} value={form[field.name]} onChange={(v) => set(field.name, v)} />;
      case 'text':
        return <TextField key={field.name} type={field.inputType ?? 'text'} label={label} error={errors[field.name]} value={form[field.name] ?? ''} onChange={(e) => set(field.name, e.target.value)} />;
      case 'date':
        return <TextField key={field.name} type="date" label={label} help={help} error={errors[field.name]} value={form[field.name] ?? ''} onChange={(e) => set(field.name, e.target.value)} />;
      case 'number':
        return <TextField key={field.name} type="number" min={field.min} max={field.max} label={label} help={help} error={errors[field.name]} value={form[field.name] ?? ''} onChange={(e) => set(field.name, e.target.value)} />;
      case 'select':
        return <SelectField key={field.name} label={label} error={errors[field.name]} options={field.options(t)} value={form[field.name]} onChange={(e) => set(field.name, e.target.value)} />;
      case 'image':
        return (
          <div key={field.name} className="space-y-4">
            {help && <p className="text-sm text-ink-soft">{help}</p>}
            <UploadField kind="image" category={config.category} disabled={locked} label={label} url={form.image?.url} onChange={({ url, alt }) => set('image', { url, alt: form.image?.alt?.fr || form.image?.alt?.en || !alt ? form.image?.alt : { fr: alt.fr, en: alt.en } })} />
            <LocalizedField name="image.alt" label={t('admin.fields.imageAlt')} errors={errors} value={form.image?.alt} onChange={(alt) => set('image', { ...form.image, alt })} />
          </div>
        );
      case 'gallery':
        return <div key={field.name} className="rounded-lg border border-slate-200 p-4"><PhotoListField title={t('admin.fields.gallery')} photos={form.gallery ?? []} disabled={locked} category={config.category} onChange={(v) => set('gallery', v)} /></div>;
      case 'file':
        return <UploadField key={field.name} kind="document" category={config.category} disabled={locked} label={label} url={form.fileUrl} onChange={({ url, size }) => change((f) => ({ ...f, fileUrl: url, fileSize: size }))} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Link to={`/admin/${resource}`} className="link-arrow mb-4 text-sm"><ArrowLeft aria-hidden="true" className="size-4" /> {t(`admin.resources.${resource}`)}</Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">{t(id ? (locked ? 'admin.editor.view' : 'admin.editor.edit') : 'admin.editor.new')}</h1>
        {id && <Link to={`/admin/preview/${resource}/${id}`} className="btn btn-secondary btn-sm"><Eye aria-hidden="true" className="size-4" /> {t('admin.preview.button')}</Link>}
      </div>
      {message && <p role={message.ok ? 'status' : 'alert'} className={`mb-4 rounded-md border p-3 text-sm ${message.ok ? 'border-sky-200 bg-sky-50' : 'border-red-200 bg-red-50 text-red-900'}`}>{message.text}</p>}
      {locked && can('content.write') && <p className="mb-4 rounded-md bg-slate-100 p-3 text-sm">{t('errors.content_locked')}</p>}
      {!can('content.write') && <p className="mb-4 rounded-md bg-slate-100 p-3 text-sm">{t('admin.readOnly')}</p>}
      <form onSubmit={onSubmit} noValidate className="max-w-5xl rounded-lg border border-slate-200 bg-white p-5 sm:p-8">
        <fieldset disabled={locked} className="space-y-6">
          {config.fields.map(renderField)}
          {form.layout === 'history' && <HistoryFields form={form} set={set} errors={errors} disabled={locked} />}
          <div className="border-t border-slate-200 pt-5">
            <CheckField label={t('admin.editor.isSample')} checked={form.isSample} onChange={(v) => set('isSample', v)} />
          </div>
          {!locked && (
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn btn-primary" disabled={saving}>{t(saving ? 'admin.editor.saving' : id ? 'admin.editor.save' : 'admin.editor.saveDraft')}</button>
              <Link to={`/admin/${resource}`} className="btn btn-secondary">{t('admin.editor.cancel')}</Link>
            </div>
          )}
        </fieldset>
      </form>
      {id && data && <WorkflowPanel resource={resource} item={data} onChange={reload} dirty={dirty} />}
    </>
  );
}
