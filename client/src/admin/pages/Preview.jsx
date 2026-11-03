import { ArrowLeft, Monitor, Smartphone, Tablet } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { LoadError, Loading } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { routePath } from '@/lib/routes';

const DEVICES = [
  { key: 'desktop', icon: Monitor, width: 'w-[1280px]' },
  { key: 'tablet', icon: Tablet, width: 'w-[768px]' },
  { key: 'mobile', icon: Smartphone, width: 'w-[390px]' },
];

const DETAIL = { projects: 'projects', articles: 'news', campaigns: 'campaigns' };
const LISTING = { publications: 'publications', team: 'team', partners: 'partners' };

/** Le vrai site est affiché dans un cadre : le rendu est celui que verront les visiteurs. */
export default function Preview() {
  const { resource, id } = useParams();
  const { t } = useTranslation();
  const [device, setDevice] = useState('desktop');
  const [lang, setLang] = useState('fr');
  const { data, error, loading, reload } = useApi(`/api/admin/${resource}/${id}`);

  if (loading) return <Loading />;
  if (error) return <LoadError onRetry={reload} />;

  const src = DETAIL[resource]
    ? `${routePath(DETAIL[resource], lang)}/${data.slug}?preview=1`
    : `${routePath(LISTING[resource], lang)}?previewId=${data._id}`;
  const { width } = DEVICES.find((d) => d.key === device);

  return (
    <>
      <Link to={`/admin/${resource}/${id}`} className="link-arrow mb-4 text-sm"><ArrowLeft aria-hidden="true" className="size-4" /> {t('admin.preview.back')}</Link>
      <h1 className="mb-4 text-4xl">{t('admin.preview.title')}</h1>
      <div className="mb-4 flex flex-wrap gap-4">
        <div role="group" aria-label={t('admin.preview.device')} className="flex gap-1">
          {DEVICES.map(({ key, icon: Icon }) => (
            <button key={key} type="button" className="chip inline-flex items-center gap-1.5" aria-pressed={device === key} onClick={() => setDevice(key)}><Icon aria-hidden="true" className="size-4" /> {t(`admin.preview.${key}`)}</button>
          ))}
        </div>
        <div role="group" aria-label={t('admin.preview.language')} className="flex gap-1">
          {['fr', 'en'].map((l) => <button key={l} type="button" className="chip" aria-pressed={lang === l} onClick={() => setLang(l)}>{t(`admin.editor.${l}`)}</button>)}
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-300 bg-slate-200 p-3">
        <iframe key={src} title={t('admin.preview.title')} src={src} className={`mx-auto h-[75vh] max-w-none bg-white ${width}`} />
      </div>
    </>
  );
}
