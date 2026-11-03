import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

const STATUS_STYLES = {
  draft: 'bg-slate-200 text-slate-800',
  pending: 'bg-amber-100 text-amber-900',
  approved: 'bg-sky-100 text-sky-900',
  rejected: 'bg-red-100 text-red-900',
  published: 'bg-emerald-100 text-emerald-900',
};

export function StatusBadge({ status }) {
  const { t } = useTranslation();
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] ?? STATUS_STYLES.draft}`}>{t(`admin.workflow.status.${status}`)}</span>;
}

export function SearchBox({ value, onChange, label }) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">{label ?? t('admin.list.search')}</label>
      <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
      <input id={id} type="search" className="input pl-9" placeholder={label ?? t('admin.list.search')} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** En-tête de colonne triable, annoncé aux lecteurs d'écran. */
export function SortHeader({ field, label, sort, dir, onSort }) {
  const active = sort === field;
  const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th scope="col" className="p-3 font-semibold" aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="flex cursor-pointer items-center gap-1 hover:text-sky-800" onClick={() => onSort(field)}>
        {label} <Icon aria-hidden="true" className="size-3.5" />
      </button>
    </th>
  );
}

export const formatDateTime = (value, lang) => (value ? new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '');
