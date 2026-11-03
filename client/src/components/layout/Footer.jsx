import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { SOCIALS } from '@/config/areas';
import { useSettings } from '@/context/SettingsContext';
import { pick } from '@/lib/content';
import { routePath } from '@/lib/routes';
import { Logo } from './Logo';

export function Footer() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { settings } = useSettings();
  const socials = SOCIALS.filter((s) => settings?.socials?.[s]);
  const FooterLink = ({ to, children }) => <li><Link to={routePath(to, lang)} className="inline-flex min-h-10 items-center hover:underline underline-offset-4 lg:min-h-0">{children}</Link></li>;
  const address = pick(settings?.address, lang);

  return (
    <footer className="bg-sky-800 text-white">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-10 py-12 sm:py-14 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
        <div className="col-span-2 lg:col-span-1">
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-sky-50">{t('footer.tagline')}</p>
        </div>
        <div>
          <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wider text-sky-100">{t('footer.explore')}</h2>
          <ul className="text-sm lg:space-y-2">
            <FooterLink to="about">{t('nav.about')}</FooterLink>
            <FooterLink to="areas">{t('footer.areasFull')}</FooterLink>
            <FooterLink to="projects">{t('nav.projects')}</FooterLink>
            <FooterLink to="news">{t('nav.news')}</FooterLink>
            <FooterLink to="publications">{t('nav.publications')}</FooterLink>
            <FooterLink to="campaigns">{t('nav.campaigns')}</FooterLink>
            <FooterLink to="team">{t('nav.team')}</FooterLink>
            <FooterLink to="partners">{t('nav.partners')}</FooterLink>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wider text-sky-100">{t('footer.engage')}</h2>
          <ul className="text-sm lg:space-y-2">
            <FooterLink to="involved">{t('nav.involved')}</FooterLink>
            <FooterLink to="contact">{t('nav.contact')}</FooterLink>
            <FooterLink to="privacy">{t('footer.privacy')}</FooterLink>
          </ul>
        </div>
        <div className="col-span-2 lg:col-span-1">
          <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wider text-sky-100">{t('footer.contact')}</h2>
          <ul className="space-y-2 text-sm text-sky-50">
            <li>{settings?.email ? <a className="underline underline-offset-4" href={`mailto:${settings.email}`}>{settings.email}</a> : `${t('contact.email')}${t('common.colon')}${t('common.toComplete')}`}</li>
            <li>{settings?.phone || `${t('contact.phone')}${t('common.colon')}${t('common.toComplete')}`}</li>
            <li>{address || `${t('contact.address')}${t('common.colon')}${t('common.toComplete')}`}</li>
          </ul>
          {socials.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {socials.map((s) => <li key={s}><a className="capitalize underline underline-offset-4" href={settings.socials[s]} target="_blank" rel="noopener noreferrer">{s}</a></li>)}
            </ul>
          )}
        </div>
      </div>
      <div className="border-t border-sky-600">
        <div className="container-page flex flex-wrap justify-between gap-2 py-5 text-xs text-sky-100">
          <p>© {new Date().getFullYear()} {t('brand.fullName')} (ADIVAH). {t('footer.rights')}</p>
          <Link to="/admin" rel="nofollow" className="inline-flex min-h-10 items-center hover:underline underline-offset-4">{t('footer.admin')}</Link>
        </div>
      </div>
    </footer>
  );
}
