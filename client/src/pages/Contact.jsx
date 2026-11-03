import { Mail, MapPin, Phone, Share2, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SubmissionForm } from '@/components/content/SubmissionForm';
import { PageHeader, ToComplete } from '@/components/ui';
import { SOCIALS } from '@/config/areas';
import { useSettings } from '@/context/SettingsContext';
import { useSeo } from '@/hooks/useSeo';
import { pick } from '@/lib/content';

const Row = ({ icon: Icon, label, children }) => (
  <div className="flex gap-3">
    <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-sky-700" />
    <div>
      <dt className="text-sm font-semibold">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  </div>
);

export default function Contact() {
  const { t, i18n } = useTranslation();
  const { settings } = useSettings();
  useSeo({ page: 'contact' });
  const address = pick(settings?.address, i18n.language);
  const socials = SOCIALS.filter((s) => settings?.socials?.[s]);

  return (
    <>
      <PageHeader title={t('contact.title')} intro={t('contact.intro')} />
      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="contact-form">
          <h2 id="contact-form" className="mb-4 text-3xl">{t('contact.formTitle')}</h2>
          <p className="mb-6 flex items-start gap-3 rounded-md border border-sky-200 bg-sky-50 p-4 text-sm">
            <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sky-800" /> {t('contact.sensitive')}
          </p>
          <SubmissionForm type="contact" />
        </section>
        <aside aria-labelledby="contact-info">
          <h2 id="contact-info" className="mb-5 text-3xl">{t('contact.infoTitle')}</h2>
          <dl className="space-y-5">
            <Row icon={Mail} label={t('contact.email')}>
              {settings?.email ? <a className="text-sky-800 underline underline-offset-2" href={`mailto:${settings.email}`}>{settings.email}</a> : <ToComplete />}
            </Row>
            <Row icon={Phone} label={t('contact.phone')}>{settings?.phone || <ToComplete />}</Row>
            <Row icon={MapPin} label={t('contact.address')}>{address || <ToComplete />}</Row>
            <Row icon={Share2} label={t('contact.social')}>
              {socials.length ? (
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                  {socials.map((s) => <li key={s}><a className="capitalize text-sky-800 underline underline-offset-2" href={settings.socials[s]} target="_blank" rel="noopener noreferrer">{s}</a></li>)}
                </ul>
              ) : <ToComplete>{t('contact.socialSoon')}</ToComplete>}
            </Row>
          </dl>
          {settings?.mapUrl && <a className="link-arrow mt-3 text-sm" href={settings.mapUrl} target="_blank" rel="noopener noreferrer">{t('contact.openMap')}</a>}
        </aside>
      </div>
    </>
  );
}
