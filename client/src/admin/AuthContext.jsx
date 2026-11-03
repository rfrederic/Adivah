import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api.get('/api/auth/me').then(setUser).catch(() => setUser(null)).finally(() => setChecking(false));
  }, []);

  const login = useCallback(async (credentials) => setUser(await api.post('/api/auth/login', credentials)), []);
  const logout = useCallback(async () => {
    await api.post('/api/auth/logout').catch(() => {});
    setUser(null);
  }, []);
  /** Sert uniquement à adapter l'affichage : le serveur vérifie chaque droit de son côté. */
  const can = useCallback((permission) => Boolean(user?.permissions?.includes(permission)), [user]);

  return <AuthContext.Provider value={{ user, checking, login, logout, setUser, can }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
