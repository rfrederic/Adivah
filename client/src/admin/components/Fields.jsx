import { FolderOpen, Loader2, Trash2, Upload } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useAuth } from '../AuthContext';
import { MediaPicker } from './MediaPicker';

export const FieldError = ({ code }) => {
  const { t } = useTranslation();
  if (!code) return null;
  return <p className="mt-1 text-sm text-red-700">{t(code === 'too_short' ? 'admin.editor.fieldRequired' : 'admin.editor.fieldInvalid')}</p>;
};

/** Champ géré séparément en français et en anglais. */
export function LocalizedField({ label, value, onChange, multiline, rows = 3, help, errors = {}, name, disabled }) {
  const { t } = useTranslation();
  const id = useId();
  const Element = multiline ? 'textarea' : 'input';
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      {help && <p className="-mt-1 mb-2 text-sm text-ink-soft">{help}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {['fr', 'en'].map((lang) => (
          <div key={lang}>
            <label htmlFor={`${id}-${lang}`} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t(`admin.editor.${lang}`)}</label>
            <Element
              id={`${id}-${lang}`}
              lang={lang}
              rows={multiline ? rows : undefined}
              className="input"
              disabled={disabled}
              value={value?.[lang] ?? ''}
              aria-invalid={Boolean(errors[`${name}.${lang}`])}
              onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
            />
            <FieldError code={errors[`${name}.${lang}`]} />
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export function TextField({ label, help, error, ...props }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} className="input" aria-invalid={Boolean(error)} {...props} />
      {help && <p className="mt-1 text-sm text-ink-soft">{help}</p>}
      <FieldError code={error} />
    </div>
  );
}

export function SelectField({ label, options, error, ...props }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <select id={id} className="input" {...props}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <FieldError code={error} />
    </div>
  );
}

export function CheckField({ label, checked, onChange, disabled }) {
  return (
    <label className="flex items-center gap-3 font-medium">
      <input type="checkbox" className="size-4 accent-sky-700" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

/** Téléversement d'une image ou d'un PDF : le fichier est envoyé dès sa sélection. */
export function UploadField({ kind, label, url, onChange, disabled: disabledProp, category }) {
  const { t } = useTranslation();
  const { can } = useAuth();
  const disabled = disabledProp || !can('media.write');
  const [picking, setPicking] = useState(false);
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isImage = kind === 'image';

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const uploaded = await api.post(`/api/admin/uploads/${kind}${category ? `?category=${category}` : ''}`, form);
      onChange(uploaded);
    } catch (err) {
      setError(t(`errors.${err.code}`, { defaultValue: t('errors.upload_failed') }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="label">{label}</p>
      {url && isImage && <img src={url} alt="" className="mb-3 max-h-40 rounded-md border border-slate-200" />}
      {url && !isImage && <p className="mb-3 text-sm"><a href={url} target="_blank" rel="noopener noreferrer" className="text-sky-800 underline">{t('admin.upload.current')}</a></p>}
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={id} className={`btn btn-secondary btn-sm ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
          {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Upload aria-hidden="true" className="size-4" />}
          {t(busy ? 'admin.upload.uploading' : isImage ? 'admin.upload.chooseImage' : 'admin.upload.chooseFile')}
        </label>
        <input id={id} type="file" className="sr-only" disabled={busy || disabled} accept={isImage ? 'image/jpeg,image/png,image/webp' : 'application/pdf'} onChange={onFile} />
        {!disabled && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPicking(true)}>
            <FolderOpen aria-hidden="true" className="size-4" /> {t('admin.media.pick')}
          </button>
        )}
        {url && !disabled && (
          <button type="button" className="btn btn-danger btn-sm" onClick={() => onChange({ url: '', size: 0 })}>
            <Trash2 aria-hidden="true" className="size-4" /> {t('admin.upload.remove')}
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-ink-soft">{t(isImage ? 'admin.upload.imageHelp' : 'admin.upload.fileHelp')}</p>
      {error && <p role="alert" className="mt-1 text-sm text-red-700">{error}</p>}
      {picking && <MediaPicker kind={kind} onClose={() => setPicking(false)} onSelect={(media) => { onChange(media); setPicking(false); }} />}
    </div>
  );
}
