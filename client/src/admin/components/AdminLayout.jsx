import { ExternalLink, FileText, Folder, Globe, Handshake, History, Image, Inbox, LayoutDashboard, LogOut, Megaphone, Menu, Newspaper, PenLine, Settings, ShieldCheck, UserCog, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { LogoImage } from '@/components/layout/Logo';
import { routePath } from '@/lib/routes';
import { useAuth } from '../AuthContext';

export function AdminLayout() {
  const { t, i18n } = useTranslation();
  const { user, logout, can } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const groups = [
    { items: [{ to: '/admin', end: true, key: 'dashboard', icon: LayoutDashboard }] },
    {
      key: 'content',
      items: [
        { to: '/admin/projects', key: 'projects', icon: Folder },
        { to: '/admin/articles', key: 'articles', icon: Newspaper },
        { to: '/admin/campaigns', key: 'campaigns', icon: Megaphone },
        { to: '/admin/publications', key: 'publications', icon: FileText },
        { to: '/admin/team', key: 'team', icon: Users },
        { to: '/admin/partners', key: 'partners', icon: Handshake },
      ],
    },
    {
      key: 'site',
      items: [
        { to: '/admin/site-content', key: 'siteContent', icon: PenLine },
        { to: '/admin/media', key: 'media', icon: Image },
        can('messages.manage') && { to: '/admin/messages', key: 'messages', icon: Inbox },
      ],
    },
    {
      key: 'administration',
      items: [
        can('users.manage') && { to: '/admin/users', key: 'users', icon: ShieldCheck },
        can('audit.read') && { to: '/admin/audit', key: 'audit', icon: History },
        { to: '/admin/settings', key: 'settings', icon: Settings },
        { to: '/admin/account', key: 'account', icon: UserCog },
      ],
    },
  ];

  return (
    <div className="min-h-dvh bg-slate-50 lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div aria-hidden="true" className="flex h-1"><span className="flex-1 bg-haiti-blue" /><span className="flex-1 bg-haiti-red" /></div>
        <div className="flex items-center justify-between p-4 lg:block">
          <p className="flex items-center gap-3 font-serif text-xl font-semibold"><LogoImage className="size-11" /> {t('admin.title')}</p>
          <button type="button" className="cursor-pointer rounded p-2 lg:hidden" aria-expanded={open} aria-controls="admin-nav" aria-label={t(open ? 'nav.close' : 'nav.menu')} onClick={() => setOpen((v) => !v)}>
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
        <div id="admin-nav" className={`${open ? 'block' : 'hidden'} px-4 pb-4 lg:block`}>
          <p className="mb-3 text-sm text-ink-soft">{user.name}<br /><span className="text-xs">{t(`admin.roles.${user.role}`)}</span></p>
          <nav aria-label={t('admin.title')} className="space-y-4">
            {groups.map((group, index) => (
              <div key={group.key ?? index}>
                {group.key && <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-ink-soft">{t(`admin.navGroups.${group.key}`)}</p>}
                <ul className="space-y-0.5">
                  {group.items.filter(Boolean).map(({ to, end, key, icon: Icon }) => (
                    <li key={key}>
                      <NavLink to={to} end={end} className={({ isActive }) => `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-sky-100 text-sky-900' : 'hover:bg-slate-100'}`}>
                        <Icon aria-hidden="true" className="size-4" /> {t(`admin.nav.${key}`)}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <div className="mt-6 space-y-2 border-t border-slate-200 pt-4">
            <LanguageSwitcher inAdmin />
            <Link to={routePath('home', i18n.language)} className="flex items-center gap-2 text-sm hover:underline"><Globe aria-hidden="true" className="size-4" /> {t('admin.viewSite')} <ExternalLink aria-hidden="true" className="size-3" /></Link>
            <button type="button" onClick={logout} className="flex cursor-pointer items-center gap-2 text-sm hover:underline"><LogOut aria-hidden="true" className="size-4" /> {t('admin.logout')}</button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-8"><Outlet /></main>
    </div>
  );
}
