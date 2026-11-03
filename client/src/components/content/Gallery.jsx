import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { pick } from '@/lib/content';
import { responsive } from '@/lib/images';

/** Affichage plein écran : la photographie d'origine, sans recadrage. Échap ferme, les flèches naviguent. */
function Lightbox({ photos, index, onIndex, onClose, lang }) {
  const { t } = useTranslation();
  const ref = useRef(null);
  const photo = photos[index];
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  const go = (delta) => onIndex((index + delta + photos.length) % photos.length);
  const onKey = (e) => {
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  };
  return (
    <dialog ref={ref} aria-label={pick(photo.caption, lang) || t('gallery.title')} onCancel={(e) => { e.preventDefault(); onClose(); }} onKeyDown={onKey} className="m-auto max-h-none max-w-none bg-transparent p-0 backdrop:bg-ink/90">
      <div className="flex h-dvh w-screen flex-col items-center justify-center gap-3 p-4">
        <img src={photo.url} alt={pick(photo.alt, lang)} className="max-h-[80dvh] max-w-full rounded object-contain" />
        {pick(photo.caption, lang) && <p className="max-w-2xl text-center text-sm text-white">{pick(photo.caption, lang)}</p>}
        <div className="flex items-center gap-3 text-white">
          {photos.length > 1 && <button type="button" className="cursor-pointer rounded-full bg-white/15 p-2 hover:bg-white/25" aria-label={t('gallery.previous')} onClick={() => go(-1)}><ChevronLeft aria-hidden="true" /></button>}
          {photos.length > 1 && <span className="text-sm">{index + 1} / {photos.length}</span>}
          {photos.length > 1 && <button type="button" className="cursor-pointer rounded-full bg-white/15 p-2 hover:bg-white/25" aria-label={t('gallery.next')} onClick={() => go(1)}><ChevronRight aria-hidden="true" /></button>}
          <button type="button" className="cursor-pointer rounded-full bg-white/15 p-2 hover:bg-white/25" aria-label={t('gallery.close')} onClick={onClose}><X aria-hidden="true" /></button>
        </div>
      </div>
    </dialog>
  );
}

/** Galerie : photos entières (pas de visage coupé), légendes, et agrandissement au clic. */
export function Gallery({ photos, lang, className = '' }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);
  if (!photos?.length) return null;
  return (
    <div className={`grid items-start gap-3 sm:gap-4 ${photos.length > 1 ? 'grid-cols-2' : ''} ${className}`}>
      {photos.map((photo, i) => {
        const caption = pick(photo.caption, lang);
        return (
          <figure key={`${photo.url}-${i}`}>
            <button type="button" className="group relative block w-full cursor-zoom-in overflow-hidden rounded-lg bg-sky-50" onClick={() => setOpen(i)} aria-label={`${t('gallery.enlarge')}${caption ? ` : ${caption}` : ''}`}>
              <img {...responsive(photo.url)} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw" alt={pick(photo.alt, lang)} width={photo.width ?? undefined} height={photo.height ?? undefined} loading="lazy" decoding="async" className="mx-auto h-auto max-h-[70vh] w-auto max-w-full lg:max-h-[42rem] transition-transform duration-500 group-hover:scale-[1.02]" />
              <span aria-hidden="true" className="absolute right-2 top-2 rounded-full bg-white/85 p-1.5 text-ink opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"><Maximize2 className="size-4" /></span>
            </button>
            {caption && <figcaption className="mt-2 border-l-2 border-haiti-red pl-2 text-xs leading-snug text-ink-soft sm:pl-3 sm:text-sm">{caption}</figcaption>}
          </figure>
        );
      })}
      {open !== null && <Lightbox photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} lang={lang} />}
    </div>
  );
}
