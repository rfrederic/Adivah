import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useConfirm } from './Confirm';
import { CheckField, LocalizedField, UploadField } from './Fields';
import { MoveButtons, PhotoListField } from './PhotoListField';

const blank = { fr: '', en: '' };

function SectionEditor({ section, index, sections, onChange, onMove, onRemove, errors, disabled }) {
  const { t } = useTranslation();
  const label = section.heading?.fr || section.key;
  const set = (name, value) => onChange({ ...section, [name]: value });

  return (
    <details className="rounded-lg border border-slate-300" open={section.hidden || undefined}>
      <summary className="cursor-pointer p-4 font-semibold">{section.date?.fr ? `${section.date.fr} : ` : ''}{label}{section.hidden ? ` (${t('admin.history.hiddenBadge')})` : ''}</summary>
      <div className="space-y-5 border-t border-slate-200 p-4">
        <div className="flex flex-wrap gap-2">
          <MoveButtons list={sections} index={index} onMove={onMove} label={label} />
          <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}><Trash2 aria-hidden="true" className="size-3.5" /> {t('admin.history.removeSection')}</button>
        </div>
        <CheckField disabled={disabled} label={t('admin.history.hidden')} checked={section.hidden} onChange={(v) => set('hidden', v)} />
        <LocalizedField label={t('admin.history.date')} name={`sections.${index}.date`} errors={errors} value={section.date} onChange={(v) => set('date', v)} />
        <LocalizedField label={t('admin.history.location')} name={`sections.${index}.location`} errors={errors} value={section.location} onChange={(v) => set('location', v)} />
        <LocalizedField label={t('admin.history.heading')} name={`sections.${index}.heading`} errors={errors} value={section.heading} onChange={(v) => set('heading', v)} />
        <LocalizedField multiline rows={6} label={t('admin.history.text')} help={t('admin.editor.bodyHelp')} name={`sections.${index}.body`} errors={errors} value={section.body} onChange={(v) => set('body', v)} />
        <PhotoListField photos={section.photos} disabled={disabled} onChange={(v) => set('photos', v)} />
      </div>
    </details>
  );
}

/** Champs propres à une publication historique. Chaque langue reste modifiable séparément. */
export function HistoryFields({ form, set, errors, disabled }) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const sections = form.sections ?? [];
  const setSeo = (name, value) => set('seo', { ...form.seo, [name]: value });
  const addSection = () => set('sections', [...sections, { key: `section-${Date.now()}`, hidden: true, date: blank, location: blank, heading: blank, body: blank, photos: [] }]);
  const removeSection = async (i) => {
    if (await confirm({ title: t('admin.history.confirmRemove'), danger: true, action: t('admin.list.delete') })) set('sections', sections.filter((_, n) => n !== i));
  };
  return (
    <div className="space-y-6 border-t border-slate-200 pt-6">
      <h2 className="text-3xl">{t('admin.history.title')}</h2>
      <p className="rounded-md bg-sky-50 p-3 text-sm">{t('admin.history.help')}</p>
      {form.reviewNotes && <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p className="mb-2 font-semibold">{t('admin.history.reviewNotes')}</p><p className="whitespace-pre-wrap">{form.reviewNotes}</p></div>}
      <UploadField kind="image" category="logo" disabled={disabled} label={t('admin.history.logo')} url={form.logoUrl} onChange={({ url }) => set('logoUrl', url)} />
      <LocalizedField label={t('admin.history.heroCaption')} name="heroCaption" errors={errors} value={form.heroCaption} onChange={(v) => set('heroCaption', v)} />
      <LocalizedField label={t('admin.history.timelineTitle')} name="timelineTitle" errors={errors} value={form.timelineTitle} onChange={(v) => set('timelineTitle', v)} />
      <div className="space-y-3">
        <h3 className="text-2xl">{t('admin.history.sections')}</h3>
        {sections.map((section, i) => (
          <SectionEditor key={section.key} section={section} index={i} sections={sections} errors={errors} disabled={disabled} onMove={(v) => set('sections', v)} onRemove={() => removeSection(i)} onChange={(v) => set('sections', sections.map((s, n) => (n === i ? v : s)))} />
        ))}
        {!disabled && <button type="button" className="btn btn-secondary btn-sm" onClick={addSection}><Plus aria-hidden="true" className="size-4" /> {t('admin.history.addSection')}</button>}
      </div>
      <LocalizedField label={t('admin.history.closingTitle')} name="closingTitle" errors={errors} value={form.closingTitle} onChange={(v) => set('closingTitle', v)} />
      <LocalizedField multiline rows={7} label={t('admin.history.closingBody')} name="closingBody" errors={errors} value={form.closingBody} onChange={(v) => set('closingBody', v)} />
      <LocalizedField multiline label={t('admin.history.closingHighlight')} name="closingHighlight" errors={errors} value={form.closingHighlight} onChange={(v) => set('closingHighlight', v)} />
      <LocalizedField label={t('admin.history.signature')} name="signature" errors={errors} value={form.signature} onChange={(v) => set('signature', v)} />
      <LocalizedField multiline label={t('admin.history.finalMessage')} name="finalMessage" errors={errors} value={form.finalMessage} onChange={(v) => set('finalMessage', v)} />
      <h3 className="text-2xl">{t('admin.settings.seo')}</h3>
      <LocalizedField label={t('admin.history.seoTitle')} name="seo.title" errors={errors} value={form.seo?.title} onChange={(v) => setSeo('title', v)} />
      <LocalizedField multiline label={t('admin.history.seoDescription')} name="seo.description" errors={errors} value={form.seo?.description} onChange={(v) => setSeo('description', v)} />
      <LocalizedField multiline label={t('admin.history.seoKeywords')} name="seo.keywords" errors={errors} value={form.seo?.keywords} onChange={(v) => setSeo('keywords', v)} />
    </div>
  );
}
