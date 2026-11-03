import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/ui';
import { useSeo } from '@/hooks/useSeo';

const SECTIONS = ['collect', 'use', 'cookies', 'rights', 'safety'];

export default function Privacy() {
  const { t } = useTranslation();
  useSeo({ page: 'privacy' });
  return (
    <>
      <PageHeader title={t('privacy.title')} intro={t('privacy.intro')} />
      <div className="container-page max-w-3xl space-y-8 py-14">
        {SECTIONS.map((s) => (
          <section key={s}>
            <h2 className="text-2xl">{t(`privacy.${s}Title`)}</h2>
            <p className="prose-page mt-2">{t(`privacy.${s}Text`)}</p>
          </section>
        ))}
      </div>
    </>
  );
}
