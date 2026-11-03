import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { routePath } from '@/lib/routes';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';

const ITEMS = ['home', 'about', 'areas', 'projects', 'news', 'publications', 'contact'];

export function Header() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  const linkClass = ({ isActive }) =>
    `whitespace-nowrap rounded px-2.5 py-2 text-[0.9375rem] font-medium transition-colors hover:text-sky-800 ${isActive ? 'text-sky-800 underline decoration-2 underline-offset-8' : 'text-ink'}`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div aria-hidden="true" className="flex h-1"><span className="flex-1 bg-haiti-blue" /><span className="flex-1 bg-haiti-red" /></div>
      <div className="container-page flex items-center justify-between gap-4 py-3">
        <Link to={routePath('home', lang)} aria-label={t('nav.home')}><Logo /></Link>
        <nav aria-label={t('nav.main')} className="hidden items-center xl:flex">
          {ITEMS.map((key) => (
            <NavLink key={key} to={routePath(key, lang)} end={key === 'home'} className={linkClass}>{t(`nav.${key}`)}</NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link to={routePath('involved', lang)} className="btn btn-primary btn-sm hidden whitespace-nowrap sm:inline-flex">{t('nav.involved')}</Link>
          <button
            type="button"
            className="flex size-11 cursor-pointer items-center justify-center rounded xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={t(open ? 'nav.close' : 'nav.menu')}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label={t('nav.main')} className="border-t border-slate-200 bg-white xl:hidden">
          <div className="container-page flex flex-col py-2">
            {[...ITEMS, 'campaigns', 'team', 'partners', 'involved'].map((key) => (
              <NavLink key={key} to={routePath(key, lang)} end={key === 'home'} className={({ isActive }) => `rounded px-2 py-3 font-medium ${isActive ? 'bg-sky-50 text-sky-800' : ''}`}>{t(`nav.${key}`)}</NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
