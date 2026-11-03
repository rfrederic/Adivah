import { ArrowDown, ArrowUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedField, UploadField } from './Fields';

const blank = { fr: '', en: '' };
export const move = (list, index, delta) => {
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(index + delta, 0, item);
  return next;
};

export function MoveButtons({ list, index, onMove, label }) {
  const { t } = useTranslation();
  return (
    <>
      <button type="button" className="btn btn-secondary btn-sm" disabled={index === 0} aria-label={`${t('admin.history.moveUp')} : ${label}`} onClick={() => onMove(move(list, index, -1))}><ArrowUp aria-hidden="true" className="size-3.5" /></button>
      <button type="button" className="btn btn-secondary btn-sm" disabled={index === list.length - 1} aria-label={`${t('admin.history.moveDown')} : ${label}`} onClick={() => onMove(move(list, index, 1))}><ArrowDown aria-hidden="true" className="size-3.5" /></button>
    </>
  );
}

/** Galerie modifiable : remplacer, ajouter, retirer, réordonner, légendes et descriptions dans les deux langues. */
export function PhotoListField({ photos = [], onChange, disabled, title, category = 'photo' }) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(0);
  const setPhoto = (i, value) => onChange(photos.map((p, n) => (n === i ? value : p)));
  const fromFile = ({ url, width, height, alt }) => ({ url, width: width ?? null, height: height ?? null, alt: alt ? { fr: alt.fr ?? '', en: alt.en ?? '' } : blank, caption: blank });
  return (
    <div className="space-y-4">
      <h4 className="font-sans text-sm font-semibold">{title ?? t('admin.history.photos')}</h4>
      {photos.map((photo, i) => (
        <div key={`${photo.url}-${i}`} className="space-y-3 rounded-md bg-slate-50 p-3">
          <UploadField kind="image" category={category} disabled={disabled} label={`${t('admin.history.photo')} ${i + 1}`} url={photo.url} onChange={(file) => (file.url ? setPhoto(i, { ...photo, url: file.url, width: file.width ?? null, height: file.height ?? null }) : onChange(photos.filter((_, n) => n !== i)))} />
          <LocalizedField label={t('admin.history.caption')} value={photo.caption} onChange={(v) => setPhoto(i, { ...photo, caption: v })} />
          <LocalizedField label={t('admin.fields.imageAlt')} value={photo.alt} onChange={(v) => setPhoto(i, { ...photo, alt: v })} />
          <div className="flex gap-2"><MoveButtons list={photos} index={i} onMove={onChange} label={`${t('admin.history.photo')} ${i + 1}`} /></div>
        </div>
      ))}
      {!disabled && <UploadField key={adding} kind="image" category={category} label={t('admin.history.addPhoto')} url="" onChange={(file) => { if (file.url) { onChange([...photos, fromFile(file)]); setAdding((n) => n + 1); } }} />}
    </div>
  );
}
