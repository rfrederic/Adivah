import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { Loading } from '@/components/ui';
import { SettingsProvider } from '@/context/SettingsContext';
import { LANGS, routes } from '@/lib/routes';
import About from '@/pages/About';
import ArticleDetail from '@/pages/ArticleDetail';
import Areas from '@/pages/Areas';
import CampaignDetail from '@/pages/CampaignDetail';
import Campaigns from '@/pages/Campaigns';
import Contact from '@/pages/Contact';
import GetInvolved from '@/pages/GetInvolved';
import Home from '@/pages/Home';
import News from '@/pages/News';
import NotFound from '@/pages/NotFound';
import Partners from '@/pages/Partners';
import Privacy from '@/pages/Privacy';
import ProjectDetail from '@/pages/ProjectDetail';
import Projects from '@/pages/Projects';
import Publications from '@/pages/Publications';
import Team from '@/pages/Team';

// L'administration est chargée à part : les visiteurs ne téléchargent pas son code.
const AdminApp = lazy(() => import('@/admin/AdminApp'));

const PAGES = { home: Home, about: About, areas: Areas, projects: Projects, news: News, publications: Publications, involved: GetInvolved, contact: Contact, privacy: Privacy, campaigns: Campaigns, team: Team, partners: Partners };

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <Routes>
          <Route path="/admin/*" element={<Suspense fallback={<div className="container-page py-16"><Loading /></div>}><AdminApp /></Suspense>} />
          {LANGS.map((lang) => (
            <Route key={lang} element={<SiteLayout lang={lang} />}>
              {Object.entries(PAGES).map(([key, Page]) => <Route key={key} path={routes[key][lang]} element={<Page />} />)}
              <Route path={`${routes.projects[lang]}/:slug`} element={<ProjectDetail />} />
              <Route path={`${routes.news[lang]}/:slug`} element={<ArticleDetail />} />
              <Route path={`${routes.campaigns[lang]}/:slug`} element={<CampaignDetail />} />
              <Route path={lang === 'en' ? '/en/*' : '*'} element={<NotFound />} />
            </Route>
          ))}
        </Routes>
      </SettingsProvider>
    </BrowserRouter>
  );
}
