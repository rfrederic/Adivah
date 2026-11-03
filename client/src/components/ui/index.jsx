import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { brand } from '@/config/brand';
import { responsive } from '@/lib/images';

/**
 * Photographie recadrée proprement (cadrage légèrement haut pour garder les visages).
 * Sans photo, un fond neutre marqué du logo : jamais une photo sans rapport, ni un message « à venir ».
 */
export function ImageSlot({ src, alt = '', className = 'aspect-[16/10]', sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw', priority = false, imgClassName = '' }) {
  if (src) {
    return <img {...responsive(src)} sizes={sizes} alt={alt} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async" className={`w-full object-cover object-[50%_30%] ${className} ${imgClassName}`} />;
  }
  return (
    <div aria-hidden="true" className={`flex w-full items-center justify-center bg-gradient-to-br from-sky-100 via-sky-50 to-white ${className}`}>
      <img src={brand.logo} alt="" width="64" height="64" className="size-16 rounded-full opacity-30" />
    </div>
  );
}

export function SampleBadge() {
  const { t } = useTranslation();
  return <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">{t('common.sample')}</span>;
}

export function Tag({ children }) {
  return <span className="inline-block rounded bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-900">{children}</span>;
}

/** Texte en attente de la version officielle fournie par l'ADIVAH. */
export function ToComplete({ children }) {
  const { t } = useTranslation();
  return <span className="rounded border border-dashed border-amber-500 bg-amber-50 px-2 py-0.5 text-sm text-amber-900">{children ?? t('common.toComplete')}</span>;
}

export function PageHeader({ title, intro }) {
  return (
    <header className="bg-sky-100">
      <div className="container-page py-14 md:py-20">
        <h1 className="max-w-3xl text-4xl md:text-5xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{intro}</p>}
      </div>
    </header>
  );
}

export function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-3xl md:text-4xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Reveal({ children, className = '', as: Tag_ = 'div' }) {
  const ref = useRef(null);
  // Sur téléphone et tablette, le contenu s'affiche directement : rien ne reste masqué si l'animation ne se déclenche pas.
  const [visible, setVisible] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 1023px)').matches);
  useEffect(() => {
    if (visible) return undefined;
    if (!('IntersectionObserver' in window)) return setVisible(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -40px' },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <Tag_ ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`}>
      {children}
    </Tag_>
  );
}

export function Loading() {
  const { t } = useTranslation();
  return (
    <p role="status" className="flex items-center gap-2 py-10 text-ink-soft">
      <Loader2 aria-hidden="true" className="size-5 animate-spin" /> {t('common.loading')}
    </p>
  );
}

export function LoadError({ onRetry }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-red-900">
      <AlertCircle aria-hidden="true" className="size-5 shrink-0" />
      <span>{t('common.loadError')}</span>
      {onRetry && <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>{t('common.retry')}</button>}
    </div>
  );
}

export function Empty({ children }) {
  return <p className="rounded-md bg-slate-50 p-8 text-center text-ink-soft">{children}</p>;
}

/** Filtres sous forme de boutons, avec l'état annoncé aux lecteurs d'écran. */
export function FilterGroup({ label, options, value, onChange, allLabel }) {
  return (
    <fieldset className="mb-4">
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      <div className="chip-row flex flex-wrap gap-2">
        <button type="button" className="chip" aria-pressed={!value} onClick={() => onChange('')}>{allLabel}</button>
        {options.map((o) => (
          <button key={o.value} type="button" className="chip" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
        ))}
      </div>
    </fieldset>
  );
}

export function Pagination({ page, pages, onChange }) {
  const { t } = useTranslation();
  if (pages <= 1) return null;
  return (
    <nav className="mt-10 flex items-center justify-center gap-4" aria-label={t('common.pageOf', { page, pages })}>
      <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>{t('common.previous')}</button>
      <span className="text-sm text-ink-soft">{t('common.pageOf', { page, pages })}</span>
      <button type="button" className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>{t('common.next')}</button>
    </nav>
  );
}
