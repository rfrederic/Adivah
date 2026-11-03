import { CalendarDays, HandHeart, Handshake, Users } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SubmissionForm } from '@/components/content/SubmissionForm';
import { PageHeader } from '@/components/ui';
import { useSeo } from '@/hooks/useSeo';

const OPTIONS = [
  { key: 'volunteer', icon: Users },
  { key: 'partner', icon: Handshake },
  { key: 'support', icon: HandHeart },
  { key: 'participate', icon: CalendarDays },
];

export default function GetInvolved() {
  const { t } = useTranslation();
  const [type, setType] = useState('volunteer');
  const formRef = useRef(null);
  useSeo({ page: 'involved' });

  const choose = (key) => {
    setType(key);
    formRef.current?.scrollIntoView({ block: 'start' });
    formRef.current?.focus({ preventScroll: true });
  };

  return (
    <>
      <PageHeader title={t('involved.title')} intro={t('involved.intro')} />
      <section className="container-page py-14">
        <ul className="grid gap-5 sm:grid-cols-2">
          {OPTIONS.map(({ key, icon: Icon }) => (
            <li key={key} className="flex flex-col rounded-lg border border-slate-200 p-6">
              <Icon aria-hidden="true" className="mb-4 size-8 text-sky-700" strokeWidth={1.5} />
              <h2 className="text-2xl">{t(`involved.${key}.title`)}</h2>
              <p className="mt-2 flex-1 leading-relaxed text-ink-soft">{t(`involved.${key}.text`)}</p>
              <button type="button" className="btn btn-secondary btn-sm mt-5 self-start" aria-pressed={type === key} onClick={() => choose(key)}>
                {t('involved.choose')}<span className="sr-only">{t('common.colon')}{t(`involved.${key}.title`)}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section ref={formRef} tabIndex={-1} aria-labelledby="involved-form" className="scroll-mt-24 bg-sky-50 py-14 outline-none">
        <div className="container-page max-w-3xl">
          <h2 id="involved-form" className="mb-6 text-3xl">{t('involved.formTitle')}</h2>
          <div className="mb-6">
            <label htmlFor="involved-type" className="label">{t('involved.typeLabel')}</label>
            <select id="involved-type" className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {OPTIONS.map(({ key }) => <option key={key} value={key}>{t(`involved.${key}.title`)}</option>)}
            </select>
          </div>
          <SubmissionForm type={type} showOrganization showSubject={false} />
        </div>
      </section>
    </>
  );
}
