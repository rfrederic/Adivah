import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSeo } from '@/hooks/useSeo';
import { routePath } from '@/lib/routes';

export default function NotFound() {
  const { t, i18n } = useTranslation();
  useSeo({ title: `${t('notFound.title')} – ADIVAH`, noindex: true });
  return (
    <div className="container-page py-24 text-center">
      <p className="eyebrow mb-3">404</p>
      <h1 className="text-4xl md:text-5xl">{t('notFound.title')}</h1>
      <p className="mt-4 text-lg text-ink-soft">{t('notFound.text')}</p>
      <Link to={routePath('home', i18n.language)} className="btn btn-primary mt-8">{t('notFound.cta')}</Link>
    </div>
  );
}
