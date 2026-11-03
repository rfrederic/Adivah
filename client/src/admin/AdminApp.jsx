import { useEffect, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Loading } from '@/components/ui';
import { AdminLayout } from './components/AdminLayout';
import { ConfirmProvider } from './components/Confirm';
import { AuthProvider, useAuth } from './AuthContext';
import Account from './pages/Account';
import AuditLog from './pages/AuditLog';
import Dashboard from './pages/Dashboard';
import { ForgotPassword, ResetPassword } from './pages/PasswordRecovery';
import Login from './pages/Login';
import MediaLibrary from './pages/MediaLibrary';
import Messages from './pages/Messages';
import Preview from './pages/Preview';
import { ResourceEditor, ResourceList } from './pages/Resources';
import Settings from './pages/Settings';
import SiteContent from './pages/SiteContent';
import Users from './pages/Users';

function Protected({ children }) {
  const { user, checking } = useAuth();
  if (checking) return <div className="container-page py-16"><Loading /></div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
}

const Need = ({ permission, children }) => {
  const { can } = useAuth();
  return can(permission) ? children : <Navigate to="/admin" replace />;
};

function AdminRoutes() {
  const { user, checking } = useAuth();
  return (
    <Routes>
      <Route path="login" element={!checking && user ? <Navigate to="/admin" replace /> : <Login />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password" element={<ResetPassword />} />
      <Route element={<Protected><ConfirmProvider><AdminLayout /></ConfirmProvider></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="preview/:resource/:id" element={<Preview />} />
        <Route path="media" element={<MediaLibrary />} />
        <Route path="site-content" element={<SiteContent />} />
        <Route path="messages" element={<Need permission="messages.manage"><Messages /></Need>} />
        <Route path="users" element={<Need permission="users.manage"><Users /></Need>} />
        <Route path="audit" element={<Need permission="audit.read"><AuditLog /></Need>} />
        <Route path="settings" element={<Settings />} />
        <Route path="account" element={<Account />} />
        <Route path=":resource/new" element={<Need permission="content.write"><ResourceEditor /></Need>} />
        <Route path=":resource/:id" element={<ResourceEditor />} />
        <Route path=":resource" element={<ResourceList />} />
      </Route>
    </Routes>
  );
}

export default function AdminApp() {
  const { t, i18n } = useTranslation();
  useLayoutEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  useEffect(() => {
    document.title = t('admin.title');
    let robots = document.head.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    robots.content = 'noindex';
  }, [t]);
  return <AuthProvider><AdminRoutes /></AuthProvider>;
}
