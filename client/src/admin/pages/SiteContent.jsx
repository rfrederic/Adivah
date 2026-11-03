import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import site from '@shared/site.json';
import { LoadError, Loading } from '@/components/ui';
import { AREAS } from '@/config/areas';
import { useSettings } from '@/context/SettingsContext';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { baseText } from '@/lib/overrides';
import { useAuth } from '../AuthContext';
import { CheckField, LocalizedField, UploadField } from '../components/Fields';

const ABOUT_FIELDS = ['presentation', 'mission', 'vision', 'approach', 'commitment', 'values', 'objectives'];
/** Description (accessibilité) et légende (contexte historique) d'une photo de page. */
function ImageTexts({ value, onChange }) {
  const { t } = useTranslation();
  return (
    <>
      <LocalizedField label={t('admin.fields.imageAlt')} value={value.alt} onChange={(v) => onChange('alt', v)} />
      <LocalizedField label={t('admin.siteContent.imageCaption')} help={t('admin.siteContent.captionHelp')} value={value.caption} onChange={(v) => onChange('caption', v)} />
    </>
  );
}

function PageImage({ label, value, onChange, disabled }) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 p-4">
      <UploadField kind="image" category="photo" disabled={disabled} label={label} url={value.url} onChange={({ url, alt }) => onChange({ ...value, url, alt: !value.alt.fr && alt?.fr ? { fr: alt.fr, en: alt.en ?? '' } : value.alt })} />
      <ImageTexts value={value} onChange={(name, v) => onChange({ ...value, [name]: v })} />
    </div>
  );
}

const toText = (value) => (Array.isArray(value) ? value.join('\n') : value ?? '');

export default function SiteContent() {
  const { t } = useTranslation();
  const { can } = useAuth();
  const { reload: reloadPublic } = useSettings();
  const { data, error, loading, reload } = useApi('/api/admin/settings');
  const [form, setForm] = useState(null);
  const [texts, setTexts] = useState({});
  const [tab, setTab] = useState('home');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const canEdit = can('pages.write');

  useEffect(() => {
    if (!data) return;
    const img = (v) => ({ url: v?.url ?? '', alt: { fr: v?.alt?.fr ?? '', en: v?.alt?.en ?? '' }, caption: { fr: v?.caption?.fr ?? '', en: v?.caption?.en ?? '' } });
    const txt = (v) => ({ alt: img(v).alt, caption: img(v).caption });
    setForm({ heroImageUrl: data.heroImageUrl, aboutImageUrl: data.aboutImageUrl, aboutIsDraft: data.aboutIsDraft,
      imageText: { hero: txt(data.imageText?.hero), about: txt(data.imageText?.about) },
      storyImage: img(data.storyImage),
      areaImages: Object.fromEntries(AREAS.map(({ key }) => [key, img(data.areaImages?.[key])])), ...Object.fromEntries(ABOUT_FIELDS.map((f) => [f, data[f] ?? { fr: '', en: '' }])) });
    const initial = {};
    for (const key of Object.values(site.editableText).flat()) {
      initial[key] = {
        fr: data.textOverrides?.fr?.[key] || toText(baseText('fr', key)),
        en: data.textOverrides?.en?.[key] || toText(baseText('en', key)),
      };
    }
    setTexts(initial);
  }, [data]);

  if (loading && !form) return <Loading />;
  if (error) return <LoadError onRetry={reload} />;
  if (!form) return <Loading />;

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const setText = (which, name, value) => setForm((f) => ({ ...f, imageText: { ...f.imageText, [which]: { ...f.imageText[which], [name]: value } } }));

  /** Seuls les textes réellement changés sont enregistrés : les autres continuent de suivre le texte d'origine. */
  const overridesOf = (lang) => Object.fromEntries(
    Object.entries(texts).filter(([key, value]) => value[lang].trim() && value[lang].trim() !== toText(baseText(lang, key)).trim()).map(([key, value]) => [key, value[lang].trim()]),
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage(null);
    try {
      await api.put('/api/admin/site-content', { ...form, textOverrides: { fr: overridesOf('fr'), en: overridesOf('en') } });
      reloadPublic();
      setMessage({ ok: true, text: t('admin.editor.saved') });
    } catch (err) {
      setErrors(err.fields ?? {});
      setMessage({ ok: false, text: err.code === 'validation' ? t('admin.editor.invalid') : t(`errors.${err.code}`, { defaultValue: t('errors.server_error') }) });
    } finally {
      setSaving(false);
      window.scrollTo({ top: 0 });
    }
  };

  const labelOf = (key) => {
    const area = AREAS.find((a) => key.includes(a.key));
    if (area) {
      if (key.startsWith('areaKeys.')) return `${t(`areaKeys.${area.key}`)} : ${t('admin.siteContent.areaTitle')}`;
      return `${t(`areaKeys.${area.key}`)} : ${t(key.endsWith('.points') ? 'admin.siteContent.areaPoints' : 'admin.siteContent.areaText')}`;
    }
    return t(`admin.siteContent.labels.${key}`);
  };

  const tabs = ['home', 'about', 'areas', 'contact', 'footer'];
  return (
    <>
      <h1 className="mb-2 text-4xl">{t('admin.siteContent.title')}</h1>
      <p className="mb-6 text-ink-soft">{t('admin.siteContent.intro')}</p>
      {!canEdit && <p className="mb-4 rounded-md bg-slate-100 p-3 text-sm">{t('admin.readOnly')}</p>}
      {message && <p role={message.ok ? 'status' : 'alert'} className={`mb-4 rounded-md border p-3 text-sm ${message.ok ? 'border-sky-200 bg-sky-50' : 'border-red-200 bg-red-50 text-red-900'}`}>{message.text}</p>}
      <div role="group" aria-label={t('admin.siteContent.title')} className="mb-4 flex flex-wrap gap-2">
        {tabs.map((name) => <button key={name} type="button" className="chip" aria-pressed={tab === name} onClick={() => setTab(name)}>{t(`admin.siteContent.tabs.${name}`)}</button>)}
      </div>
      <form onSubmit={onSubmit} noValidate className="max-w-5xl rounded-lg border border-slate-200 bg-white p-5 sm:p-8">
        <fieldset disabled={!canEdit} className="space-y-6">
          {tab === 'home' && (
            <>
              <UploadField kind="image" category="photo" disabled={!canEdit} label={t('admin.settings.hero')} url={form.heroImageUrl} onChange={({ url, alt }) => { set('heroImageUrl', url); if (alt?.fr && !form.imageText.hero.alt.fr) setText('hero', 'alt', alt); }} />
              <ImageTexts value={form.imageText.hero} onChange={(name, v) => setText('hero', name, v)} />
              <PageImage label={t('admin.siteContent.storyImage')} value={form.storyImage} onChange={(v) => set('storyImage', v)} disabled={!canEdit} />
            </>
          )}
          {tab === 'about' && (
            <>
              <UploadField kind="image" category="photo" disabled={!canEdit} label={t('admin.settings.aboutImage')} url={form.aboutImageUrl} onChange={({ url, alt }) => { set('aboutImageUrl', url); if (alt?.fr && !form.imageText.about.alt.fr) setText('about', 'alt', alt); }} />
              <ImageTexts value={form.imageText.about} onChange={(name, v) => setText('about', name, v)} />
              {ABOUT_FIELDS.map((name) => (
                <LocalizedField key={name} multiline rows={name === 'values' || name === 'objectives' ? 7 : 5} name={name} label={t(`admin.settings.${name}`)} errors={errors} value={form[name]} onChange={(v) => set(name, v)} />
              ))}
              <CheckField disabled={!canEdit} label={t('admin.settings.aboutIsDraft')} checked={form.aboutIsDraft} onChange={(v) => set('aboutIsDraft', v)} />
            </>
          )}
          {tab === 'areas' && AREAS.map(({ key }) => (
            <PageImage key={key} label={`${t(`areaKeys.${key}`)} : ${t('admin.siteContent.areaImage')}`} value={form.areaImages[key]} onChange={(v) => set('areaImages', { ...form.areaImages, [key]: v })} disabled={!canEdit} />
          ))}
          {site.editableText[tab].map((key) => {
            const isLong = key.endsWith('.points') || toText(baseText('fr', key)).length > 70;
            return <LocalizedField key={key} multiline={isLong} rows={key.endsWith('.points') ? 4 : 3} help={key.endsWith('.points') ? t('admin.siteContent.oneByLine') : undefined} label={labelOf(key)} value={texts[key]} onChange={(v) => setTexts((all) => ({ ...all, [key]: v }))} />;
          })}
          {canEdit && <button type="submit" className="btn btn-primary" disabled={saving}>{t(saving ? 'admin.editor.saving' : 'admin.editor.save')}</button>}
        </fieldset>
      </form>
    </>
  );
}
