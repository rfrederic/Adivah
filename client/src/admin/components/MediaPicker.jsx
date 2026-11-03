import { FileText } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Empty, LoadError, Loading, Pagination } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { Modal } from './Confirm';
import { SearchBox } from './Table';

/** Réutilise un fichier déjà présent dans la médiathèque. */
export function MediaPicker({ kind, onSelect, onClose }) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const query = new URLSearchParams({ kind, page: String(page), limit: '12' });
  if (q) query.set('q', q);
  const { data, error, loading, reload } = useApi(`/api/admin/media?${query}`);
  return (
    <Modal wide title={t('admin.media.pick')} onClose={onClose}>
      <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} />
      <div className="mt-4 max-h-[55vh] overflow-y-auto">
        {loading && !data && <Loading />}
        {error && <LoadError onRetry={reload} />}
        {data && !data.items.length && <Empty>{t('admin.media.empty')}</Empty>}
        {data && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {data.items.map((m) => (
              <li key={m._id}>
                <button type="button" className="w-full cursor-pointer rounded-md border border-slate-200 p-2 text-left hover:border-sky-700" onClick={() => onSelect(m)}>
                  {m.kind === 'image' ? <img src={m.url} alt="" className="aspect-square w-full rounded object-cover" /> : <span className="flex aspect-square items-center justify-center rounded bg-sky-100 text-sky-800"><FileText aria-hidden="true" className="size-8" /></span>}
                  <span className="mt-1 block truncate text-xs">{m.originalName}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
      <div className="mt-4 flex justify-end"><button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>{t('admin.editor.cancel')}</button></div>
    </Modal>
  );
}
